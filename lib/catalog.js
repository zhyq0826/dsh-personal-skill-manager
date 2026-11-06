/**
 * Community favorite catalog.
 *
 * A favorite is a portable source record, not a copy of the skill. The personal
 * repository stores `.skill-hub/catalog.json`; another machine reads it and
 * installs the recorded commit into the selected clients. Only "Save as my
 * skill" copies content into the personal library.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import {
  addCatalogEntry,
  catalogPath,
  readCatalog,
  resolveSource,
} from './core.js';
import { scanTargetEntries } from './targets.js';

const SKIP_COPY = new Set(['.git', 'node_modules', '.DS_Store', '.trash']);
const GIT_TIMEOUT = 60_000;

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function runGit(cwd, args, timeout = GIT_TIMEOUT) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = execFile(
      '/usr/bin/git',
      ['-c', 'core.hooksPath=/dev/null', ...args],
      {
        cwd,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      },
      (error, stdout) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(stdout);
      },
    );
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(new Error(`git command timed out after ${timeout}ms`));
    }, timeout);
  });
}


function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function copyTree(sourceDirectory, targetDirectory, budget, limits) {
  const entries = await fsp.readdir(sourceDirectory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (SKIP_COPY.has(entry.name)) continue;
    const source = path.join(sourceDirectory, entry.name);
    const target = path.join(targetDirectory, entry.name);
    if (entry.isSymbolicLink()) {
      budget.skipped += 1;
      continue;
    }
    if (entry.isDirectory()) {
      await fsp.mkdir(target, { recursive: true, mode: 0o755 });
      await copyTree(source, target, budget, limits);
      continue;
    }
    if (!entry.isFile()) {
      budget.skipped += 1;
      continue;
    }
    const stat = await fsp.stat(source);
    budget.files += 1;
    budget.bytes += stat.size;
    if (budget.files > limits.maxFiles) throw new Error('skill bundle has too many files');
    if (budget.bytes > limits.maxBytes) throw new Error('skill bundle exceeds the byte limit');
    await fsp.copyFile(source, target);
    await fsp.chmod(target, stat.mode & 0o777);
  }
}

async function sameContent(left, right) {
  const hash = async (target) => {
    const { createHash } = await import('node:crypto');
    const digest = createHash('sha256');
    const visit = async (current, relative) => {
      const stat = await fsp.lstat(current);
      if (stat.isSymbolicLink()) {
        digest.update(`l\0${relative}\0${await fsp.readlink(current)}\0`);
        return;
      }
      if (stat.isFile()) {
        digest.update(`f\0${relative}\0${stat.mode & 0o777}\0`);
        digest.update(await fsp.readFile(current));
        return;
      }
      if (!stat.isDirectory()) return;
      digest.update(`d\0${relative}\0${stat.mode & 0o777}\0`);
      for (const entry of (await fsp.readdir(current, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
        if (SKIP_COPY.has(entry.name)) continue;
        await visit(path.join(current, entry.name), relative === '' ? entry.name : `${relative}/${entry.name}`);
      }
    };
    await visit(target, '');
    return digest.digest('hex');
  };
  try {
    return (await hash(left)) === (await hash(right));
  } catch {
    return false;
  }
}

function backupPath(config, target, name, destination) {
  fs.mkdirSync(config.backupDir, { recursive: true });
  const backup = path.join(config.backupDir, `catalog-${target.id}-${name}-${stamp()}-${randomUUID().slice(0, 6)}`);
  try {
    fs.renameSync(destination, backup);
  } catch {
    fs.cpSync(destination, backup, { recursive: true, force: true });
    fs.rmSync(destination, { recursive: true, force: true });
  }
  return backup;
}

/** Add a client skill to the source catalog without copying content. */
export function favoriteToCatalog(config, request) {
  const entries = scanTargetEntries(config, { includeDisabled: true }).filter(
    (entry) => entry.name === request.name && (request.clientId === undefined || entry.targetId === request.clientId),
  );
  const entry = entries[0];
  if (entry === undefined) {
    throw Object.assign(new Error(`skill "${request.name}" was not found in a client directory`), { status: 404 });
  }
  const source = resolveSource(config, {
    name: entry.name,
    path: entry.path,
    group: 'community',
    flat: entry.flat,
  });
  return addCatalogEntry(config, {
    name: entry.name,
    source,
    collectedFrom: { id: entry.targetId, label: entry.targetLabel },
    addedAt: new Date().toISOString(),
  });
}

async function prepareSource(config, entry) {
  const temp = path.join(config.importsDir, randomUUID());
  fs.mkdirSync(config.importsDir, { recursive: true });
  await runGit(process.cwd(), ['clone', '--no-checkout', '--no-hardlinks', '--', entry.source.repository, temp], 30_000);
  await runGit(temp, ['checkout', '--detach', entry.source.revision], 30_000);
  const sourcePath = entry.source.subpath === '' ? temp : path.join(temp, entry.source.subpath);
  if (!fs.existsSync(sourcePath)) {
    throw new Error('source path is missing at that commit');
  }
  return { temp, sourcePath };
}

async function copySourceToTarget(config, entry, sourcePath, target, replaceConflicts) {
  const destination = path.join(target.path, entry.source.flat ? `${entry.name}.md` : entry.name);
  fs.mkdirSync(target.path, { recursive: true });
  if (fs.existsSync(destination)) {
    const same = await sameContent(sourcePath, destination);
    if (same) return { name: entry.name, targetId: target.id, state: 'present', path: destination };
    if (!replaceConflicts) {
      return { name: entry.name, targetId: target.id, state: 'conflict', path: destination };
    }
    backupPath(config, target, entry.name, destination);
  }
  if (entry.source.flat) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(sourcePath, destination);
  } else {
    fs.mkdirSync(destination, { recursive: true, mode: 0o755 });
    const budget = { files: 0, bytes: 0, skipped: 0 };
    await copyTree(sourcePath, destination, budget, {
      maxFiles: config.maxBundleFiles,
      maxBytes: config.maxBundleBytes,
    });
  }
  if (!entry.source.flat && !fs.existsSync(path.join(destination, 'SKILL.md'))) {
    fs.rmSync(destination, { recursive: true, force: true });
    return { name: entry.name, targetId: target.id, state: 'failed', error: 'copied bundle has no SKILL.md' };
  }
  return { name: entry.name, targetId: target.id, state: 'installed', path: destination };
}

/** Install catalog favorites into enabled targets without touching the library. */
export async function installCatalog(config, options = {}) {
  const catalog = readCatalog(config);
  const names = Array.isArray(options.names) && options.names.length > 0 ? new Set(options.names) : null;
  const targetIds =
    Array.isArray(options.targetIds) && options.targetIds.length > 0 ? new Set(options.targetIds) : null;
  const targets = (config.targets ?? []).filter(
    (target) => target.enabled === true && (targetIds === null || targetIds.has(target.id)),
  );
  const results = [];
  for (const entry of catalog.entries) {
    if (names !== null && !names.has(entry.name)) continue;
    if (entry.source.kind !== 'git') {
      results.push({ name: entry.name, state: 'needs-source', error: entry.source.reason ?? 'no source' });
      continue;
    }
    let prepared;
    try {
      prepared = await prepareSource(config, entry);
      for (const target of targets) {
        if (path.resolve(target.path) === path.resolve(config.personalDir)) continue;
        try {
          results.push(
            await copySourceToTarget(config, entry, prepared.sourcePath, target, options.replaceConflicts === true),
          );
        } catch (error) {
          results.push({ name: entry.name, targetId: target.id, state: 'failed', error: messageOf(error) });
        }
      }
    } catch (error) {
      results.push({ name: entry.name, state: 'failed', error: messageOf(error) });
    } finally {
      if (prepared !== undefined) fs.rmSync(prepared.temp, { recursive: true, force: true });
    }
  }
  const summary = {
    at: new Date().toISOString(),
    kind: 'catalog',
    results,
    installed: results.filter((result) => result.state === 'installed').length,
    present: results.filter((result) => result.state === 'present').length,
    conflicts: results.filter((result) => result.state === 'conflict').length,
    failed: results.filter((result) => result.state === 'failed').length,
    needsSource: results.filter((result) => result.state === 'needs-source').length,
  };
  try {
    fs.mkdirSync(path.dirname(config.lastCatalogPath), { recursive: true });
    fs.writeFileSync(config.lastCatalogPath, `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
  } catch {
    // Status persistence is best effort.
  }
  return summary;
}


export function lastCatalog(config) {
  try {
    return JSON.parse(fs.readFileSync(config.lastCatalogPath, 'utf8'));
  } catch {
    return null;
  }
}

export { catalogPath };
