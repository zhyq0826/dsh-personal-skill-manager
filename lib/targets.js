/**
 * Agent targets and distribution.
 *
 * The personal directory is the only content source. Codex, Claude Code,
 * Cursor, DSH, and the shared agent root are installation targets: they may
 * receive a symbolic link or a copy, but they never become a second source.
 * Existing target content is reported as a conflict unless the caller asks to
 * back it up and replace it.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

import {
  collectSkills,
  addCatalogEntry,
  defaultTargets,
  ensureCatalogFromManifest,
  readCatalog,
  isValidSkillName,
  libraryBase,
  parseFrontmatter,
  readLibraryManifest,
  removeCatalogEntry,
  readSkill,
  readV2Favorites,
  resolveSource,
  setSkillMeta,
  writeLibraryManifest,
} from './core.js';

const SKIP_COPY = new Set(['.git', 'node_modules', '.DS_Store', '.trash']);

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function sourcePath(skill) {
  return skill.flat ? skill.path : path.dirname(skill.path);
}

function targetPath(target, skill) {
  return path.join(target.path, skill.flat ? `${skill.name}.md` : skill.name);
}

function sameRealPath(left, right) {
  try {
    return fs.realpathSync(left) === fs.realpathSync(right);
  } catch {
    return false;
  }
}

function digestPath(target) {
  const hash = createHash('sha256');
  const visit = (current, relative, budget) => {
    if (budget.files > 2000) return;
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      hash.update(`l\0${relative}\0${fs.readlinkSync(current)}\0`);
      return;
    }
    if (stat.isFile()) {
      budget.files += 1;
      hash.update(`f\0${relative}\0${stat.mode & 0o777}\0`);
      hash.update(fs.readFileSync(current));
      return;
    }
    if (!stat.isDirectory()) {
      hash.update(`o\0${relative}\0`);
      return;
    }
    hash.update(`d\0${relative}\0${stat.mode & 0o777}\0`);
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (SKIP_COPY.has(entry.name)) continue;
      visit(path.join(current, entry.name), relative === '' ? entry.name : `${relative}/${entry.name}`, budget);
    }
  };
  visit(target, '', { files: 0 });
  return hash.digest('hex');
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

function enabledTargets(config, includeDisabled = false) {
  const targets = Array.isArray(config.targets) && config.targets.length > 0
    ? config.targets
    : defaultTargets(config);
  return targets.filter((target) => includeDisabled || target.enabled === true);
}

/**
 * Scan direct entries of each target root. A target that is the personal
 * directory itself is the source and is skipped.
 */
export function scanTargetEntries(config, options = {}) {
  const entries = [];
  for (const target of enabledTargets(config, options.includeDisabled === true)) {
    if (path.resolve(target.path) === path.resolve(config.personalDir)) continue;
    let children;
    try {
      children = fs.readdirSync(target.path, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const child of children) {
      if (child.name.startsWith('.')) continue;
      let file;
      let flat = false;
      let linked = false;
      try {
        if (child.isDirectory()) {
          file = path.join(target.path, child.name, 'SKILL.md');
        } else if (child.isFile() && child.name.endsWith('.md')) {
          file = path.join(target.path, child.name);
          flat = true;
        } else if (child.isSymbolicLink()) {
          linked = true;
          const linkedStat = fs.statSync(path.join(target.path, child.name));
          if (linkedStat.isDirectory()) {
            file = path.join(target.path, child.name, 'SKILL.md');
          } else if (linkedStat.isFile() && child.name.endsWith('.md')) {
            file = path.join(target.path, child.name);
            flat = true;
          } else {
            continue;
          }
        } else {
          continue;
        }
        const stat = fs.statSync(file);
        if (!stat.isFile() || stat.size > 1024 * 1024) continue;
        const content = fs.readFileSync(file, 'utf8');
        const parsed = parseFrontmatter(content);
        const name = parsed.name ?? (flat ? child.name.replace(/\.md$/, '') : child.name);
        const description = parsed.description ?? '';
        if (!isValidSkillName(name)) continue;
        entries.push({
          name,
          path: file,
          targetId: target.id,
          targetLabel: target.label,
          targetRoot: target.path,
          linked,
          flat,
          description,
        });
      } catch {
        // An unreadable target entry is omitted, not allowed to break other roots.
      }
    }
  }
  return entries;
}

/** Installation state of one library skill in every enabled target. */
export function targetStates(config, skill) {
  const source = sourcePath(skill);
  return enabledTargets(config).map((target) => {
    if (path.resolve(target.path) === path.resolve(config.personalDir)) {
      return { id: target.id, label: target.label, path: target.path, state: 'source' };
    }
    const destination = targetPath(target, skill);
    let stat;
    try {
      stat = fs.lstatSync(destination);
    } catch {
      return { id: target.id, label: target.label, path: destination, state: 'missing' };
    }
    if (stat.isSymbolicLink()) {
      return {
        id: target.id,
        label: target.label,
        path: destination,
        state: sameRealPath(destination, source) ? 'linked' : 'conflict',
      };
    }
    try {
      return {
        id: target.id,
        label: target.label,
        path: destination,
        state: digestPath(destination) === digestPath(source) ? 'present' : 'conflict',
      };
    } catch {
      return { id: target.id, label: target.label, path: destination, state: 'conflict' };
    }
  });
}

/** Target entries whose names are not in the personal library. */
export function discoverTargetOnly(config, libraryNames) {
  const byName = new Map();
  for (const entry of scanTargetEntries(config)) {
    if (libraryNames.has(entry.name)) continue;
    const existing = byName.get(entry.name) ?? [];
    existing.push({
      targetId: entry.targetId,
      targetLabel: entry.targetLabel,
      path: entry.path,
      linked: entry.linked,
      flat: entry.flat,
    });
    byName.set(entry.name, existing);
  }
  return [...byName.entries()]
    .map(([name, targets]) => ({ name, targets }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function copyIntoLibrary(config, name, entry) {
  const base = libraryBase(config);
  const target = path.join(base, name);
  const flatTarget = path.join(base, `${name}.md`);
  if (fs.existsSync(target) || fs.existsSync(flatTarget)) {
    throw Object.assign(new Error(`a library skill named "${name}" already exists`), { status: 409 });
  }
  const source = entry.flat ? fs.realpathSync(entry.path) : fs.realpathSync(path.dirname(entry.path));
  const budget = { files: 0, bytes: 0, skipped: 0 };
  if (entry.flat) {
    await fsp.mkdir(target, { recursive: true, mode: 0o755 });
    await fsp.copyFile(source, path.join(target, 'SKILL.md'));
    budget.files = 1;
    budget.bytes = fs.statSync(source).size;
  } else {
    await fsp.mkdir(target, { recursive: true, mode: 0o755 });
    await copyTree(source, target, budget, {
      maxFiles: config.maxBundleFiles,
      maxBytes: config.maxBundleBytes,
    });
  }
  if (!fs.existsSync(path.join(target, 'SKILL.md'))) {
    fs.rmSync(target, { recursive: true, force: true });
    throw new Error(`could not copy the instruction file for "${name}"`);
  }
  return { target, files: budget.files, bytes: budget.bytes, skipped: budget.skipped };
}

/**
 * Copy one client skill into skills/ as a skill the user will maintain.
 * Favorite does not call this. Only an explicit save-as-mine does.
 */
export async function collectTarget(config, request) {
  const entries = scanTargetEntries(config, { includeDisabled: true }).filter(
    (entry) => entry.name === request.name && (request.targetId === undefined || entry.targetId === request.targetId),
  );
  const entry = entries[0];
  if (entry === undefined) throw Object.assign(new Error(`skill "${request.name}" was not found in a target`), { status: 404 });
  const copied = await copyIntoLibrary(config, request.name, entry);
  let provenance = request.sourceOverride;
  if (provenance === undefined || provenance === null) {
    try {
      provenance = resolveSource(config, {
        name: request.name,
        path: entry.path,
        group: 'community',
        flat: entry.flat,
      });
    } catch {
      provenance = { kind: 'unknown', reason: 'target source could not be resolved' };
    }
  }
  if (request.writeMeta !== false) {
    setSkillMeta(config, request.name, {
      kind: 'personal',
      favorite: false,
      source: provenance,
      collectedFrom: { id: entry.targetId, label: entry.targetLabel },
      addedAt: new Date().toISOString(),
    });
  }
  return {
    name: request.name,
    targetId: entry.targetId,
    path: path.join(copied.target, 'SKILL.md'),
    ...copied,
    source: provenance,
    meta: {
      kind: 'personal',
      favorite: false,
      source: provenance,
      collectedFrom: { id: entry.targetId, label: entry.targetLabel },
      addedAt: new Date().toISOString(),
    },
  };
}


function backupPath(config, target, name, destination) {
  const source = destination;
  try {
    fs.renameSync(source, path.join(config.backupDir, `${target.id}-${name}-${stamp()}-${randomUUID().slice(0, 6)}`));
  } catch {
    const fallback = path.join(config.backupDir, `${target.id}-${name}-${stamp()}-${randomUUID().slice(0, 6)}`);
    fs.cpSync(source, fallback, { recursive: true, force: true });
    fs.rmSync(source, { recursive: true, force: true });
  }
}

function installInto(config, target, skill, replaceConflicts, results) {
  const source = sourcePath(skill);
  const destination = targetPath(target, skill);
  const isDirectory = !skill.flat;
  fs.mkdirSync(target.path, { recursive: true });
  let exists = false;
  let stat;
  try {
    stat = fs.lstatSync(destination);
    exists = true;
  } catch {
    exists = false;
  }
  if (exists) {
    if (stat.isSymbolicLink()) {
      if (sameRealPath(destination, source)) {
        results.push({ name: skill.name, targetId: target.id, state: 'linked', path: destination });
        return;
      }
      if (!replaceConflicts) {
        results.push({ name: skill.name, targetId: target.id, state: 'conflict', path: destination });
        return;
      }
      backupPath(config, target, skill.name, destination);
    } else {
      let same = false;
      try {
        same = digestPath(destination) === digestPath(source);
      } catch {
        same = false;
      }
      if (same) {
        results.push({ name: skill.name, targetId: target.id, state: 'present', path: destination });
        return;
      }
      if (!replaceConflicts) {
        results.push({ name: skill.name, targetId: target.id, state: 'conflict', path: destination });
        return;
      }
      backupPath(config, target, skill.name, destination);
    }
  }
  if (target.mode === 'copy') {
    if (isDirectory) {
      fs.mkdirSync(destination, { recursive: true, mode: 0o755 });
      const budget = { files: 0, bytes: 0, skipped: 0 };
      // Synchronous copy keeps one distribution pass deterministic; bundles are small.
      const copySync = (from, to) => {
        for (const entry of fs.readdirSync(from, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
          if (SKIP_COPY.has(entry.name)) continue;
          const fromPath = path.join(from, entry.name);
          const toPath = path.join(to, entry.name);
          if (entry.isSymbolicLink()) {
            budget.skipped += 1;
            continue;
          }
          if (entry.isDirectory()) {
            fs.mkdirSync(toPath, { recursive: true, mode: 0o755 });
            copySync(fromPath, toPath);
            continue;
          }
          if (!entry.isFile()) continue;
          const fileStat = fs.statSync(fromPath);
          budget.files += 1;
          budget.bytes += fileStat.size;
          if (budget.files > config.maxBundleFiles) throw new Error('skill bundle has too many files');
          if (budget.bytes > config.maxBundleBytes) throw new Error('skill bundle exceeds the byte limit');
          fs.copyFileSync(fromPath, toPath);
          fs.chmodSync(toPath, fileStat.mode & 0o777);
        }
      };
      copySync(source, destination);
    } else {
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
      fs.chmodSync(destination, fs.statSync(source).mode & 0o777);
    }
    results.push({ name: skill.name, targetId: target.id, state: 'copied', path: destination });
    return;
  }
  fs.symlinkSync(source, destination, isDirectory ? 'dir' : 'file');
  results.push({ name: skill.name, targetId: target.id, state: 'linked', path: destination });
}


/** One row per skill name, merging the personal library with installed clients. */
export async function collectAllSkills(config) {
  const library = await collectSkills(config, { libraryOnly: true, cwd: config.dshHome });
  const manifest = readLibraryManifest(config);
  const catalog = ensureCatalogFromManifest(config);
  const catalogByName = new Map(catalog.entries.map((entry) => [entry.name, entry]));
  const allTargets = enabledTargets(config, true);
  const targetById = new Map(allTargets.map((target) => [target.id, target]));
  const rows = new Map();
  for (const skill of library.skills) {
    const meta = manifest.skills[skill.name];
    const states = targetStates(config, skill);
    const clients = [{ id: 'library', label: 'Personal library', state: 'source', path: skill.path }];
    for (const state of states) {
      if (state.state === 'missing' || state.state === 'source') continue;
      clients.push({ id: state.id, label: state.label, state: state.state, path: state.path });
    }
    const collectedFrom = meta?.collectedFrom ?? null;
    if (collectedFrom !== null && !clients.some((client) => client.id === collectedFrom.id)) {
      clients.push({
        id: collectedFrom.id,
        label: collectedFrom.label ?? collectedFrom.id,
        state: 'collected',
        path: null,
      });
    }
    rows.set(skill.name, {
      name: skill.name,
      description: skill.description,
      path: skill.path,
      flat: skill.flat,
      linked: skill.linked,
      inLibrary: true,
      kind: meta?.kind ?? 'personal',
      favorite: catalogByName.has(skill.name),
      inCatalog: catalogByName.has(skill.name),
      catalogSource: catalogByName.get(skill.name)?.source ?? null,
      collectedFrom,
      clients,
      clientIds: [...new Set(clients.map((client) => client.id))],
      targets: states,
      editable: true,
      deletable: true,
      modelInvocable: skill.modelInvocable,
      userInvocable: skill.userInvocable,
    });
  }
  for (const entry of scanTargetEntries(config, { includeDisabled: true })) {
    const existing = rows.get(entry.name);
    const client = {
      id: entry.targetId,
      label: entry.targetLabel,
      state: 'client',
      path: entry.path,
      linked: entry.linked,
    };
    if (existing !== undefined) {
      if (!existing.clientIds.includes(entry.targetId)) {
        const state = existing.targets.find((target) => target.id === entry.targetId)?.state;
        existing.clients.push({
          ...client,
          state: state !== undefined && state !== 'missing' ? state : 'client',
        });
        existing.clientIds.push(entry.targetId);
      }
      continue;
    }
    rows.set(entry.name, {
      name: entry.name,
      description: entry.description ?? '',
      path: entry.path,
      flat: entry.flat,
      linked: entry.linked,
      inLibrary: false,
      kind: 'client',
      favorite: catalogByName.has(entry.name),
      inCatalog: catalogByName.has(entry.name),
      catalogSource: catalogByName.get(entry.name)?.source ?? null,
      collectedFrom: null,
      clients: [client],
      clientIds: [entry.targetId],
      targets: [],
      editable: false,
      deletable: false,
      modelInvocable: true,
      userInvocable: true,
    });
  }
  const skills = [...rows.values()].sort(
    (left, right) =>
      Number(right.inLibrary) - Number(left.inLibrary) ||
      left.name.localeCompare(right.name) ||
      String(left.path ?? '').localeCompare(String(right.path ?? '')),
  );
  const clients = [
    { id: 'library', label: 'Personal library', enabled: true },
    ...allTargets.map((target) => ({ id: target.id, label: target.label, enabled: target.enabled })),
  ];
  return {
    complete: library.complete,
    count: skills.length,
    clients,
    skills,
    catalog: {
      count: catalog.entries.length,
      installable: catalog.entries.filter((entry) => entry.source.kind === 'git').length,
      entries: catalog.entries.map((entry) => ({
        name: entry.name,
        sourceKind: entry.source.kind,
        source: entry.source,
        collectedFrom: entry.collectedFrom ?? null,
        installable: entry.source.kind === 'git',
      })),
    },
  };
}

/** Read a client-only skill for the detail panel without adding it to the library. */
export async function readTargetSkill(config, selector) {
  const entries = scanTargetEntries(config, { includeDisabled: true });
  const entry = entries.find(
    (candidate) =>
      (selector.path !== undefined && candidate.path === selector.path) ||
      (selector.name !== undefined && candidate.name === selector.name),
  );
  if (entry === undefined) return undefined;
  const detail = await readSkill(
    config,
    {
      skills: [
        {
          ...entry,
          group: 'client',
          source: 'target',
          provider: entry.targetLabel,
          editable: false,
          deletable: false,
          modelInvocable: true,
          userInvocable: true,
        },
      ],
    },
    { name: entry.name, path: entry.path },
  );
  return {
    ...detail,
    inLibrary: false,
    kind: 'client',
    clients: [
      {
        id: entry.targetId,
        label: entry.targetLabel,
        state: 'client',
        path: entry.path,
        linked: entry.linked,
      },
    ],
    targets: [],
  };
}


/** Promote a collected library skill to a written personal skill. */
export async function saveAsMine(config, request) {
  const collected = await collectSkills(config, { libraryOnly: true, cwd: config.dshHome });
  const existing = collected.skills.find((skill) => skill.name === request.name);
  if (existing !== undefined) {
    const manifest = readLibraryManifest(config);
    const meta = manifest.skills[request.name] ?? {
      kind: 'collected',
      favorite: true,
      source: null,
      collectedFrom: null,
      addedAt: new Date().toISOString(),
    };
    setSkillMeta(config, request.name, {
      ...meta,
      kind: 'personal',
      favorite: false,
    });
    removeCatalogEntry(config, request.name);
    return { name: request.name, kind: 'personal', promoted: true, path: existing.path };
  }
  const result = await collectTarget(config, {
    name: request.name,
    targetId: request.clientId ?? request.targetId,
    writeMeta: false,
  });
  setSkillMeta(config, request.name, {
    ...result.meta,
    kind: 'personal',
    favorite: false,
  });
  removeCatalogEntry(config, request.name);
  return {
    name: request.name,
    kind: 'personal',
    collected: true,
    path: result.path,
    targetId: result.targetId,
  };
}


/** Move legacy collected copies out of the library into the plugin backups. */
export async function cleanupLegacyCollected(config) {
  ensureCatalogFromManifest(config);
  const manifest = readLibraryManifest(config);
  const collected = await collectSkills(config, { libraryOnly: true, cwd: config.dshHome });
  const legacy = collected.skills.filter((skill) => manifest.skills[skill.name]?.kind === 'collected');
  if (legacy.length === 0) return { moved: 0, names: [], backupRoot: null };
  const backupRoot = path.join(config.backupDir, 'legacy-collected', stamp());
  fs.mkdirSync(backupRoot, { recursive: true });
  const names = [];
  for (const skill of legacy) {
    const target = path.join(backupRoot, skill.name);
    if (skill.flat) {
      fs.mkdirSync(target, { recursive: true });
      fs.renameSync(skill.path, path.join(target, 'SKILL.md'));
    } else {
      fs.renameSync(path.dirname(skill.path), target);
    }
    delete manifest.skills[skill.name];
    names.push(skill.name);
  }
  writeLibraryManifest(config, manifest);
  return { moved: names.length, names, backupRoot };
}

/** Distribute one library skill to selected targets. */
export async function distributeSkill(config, request) {
  const collected = await collectSkills(config, { libraryOnly: true, cwd: config.dshHome });
  const manifest = readLibraryManifest(config);
  const skill = collected.skills.find((candidate) => candidate.name === request.name);
  if (skill === undefined) throw Object.assign(new Error(`skill "${request.name}" is not in the personal library`), { status: 404 });
  if ((manifest.skills[skill.name]?.kind ?? 'personal') !== 'personal') {
    throw Object.assign(new Error(`skill "${request.name}" is a favorite; save it as my skill before distributing`), { status: 409 });
  }
  const wanted = Array.isArray(request.targetIds) && request.targetIds.length > 0 ? new Set(request.targetIds) : null;
  const results = [];
  for (const target of enabledTargets(config)) {
    if (wanted !== null && !wanted.has(target.id)) continue;
    if (path.resolve(target.path) === path.resolve(config.personalDir)) {
      results.push({ name: skill.name, targetId: target.id, state: 'source', path: target.path });
      continue;
    }
    try {
      installInto(config, target, skill, request.replaceConflicts === true, results);
    } catch (error) {
      results.push({ name: skill.name, targetId: target.id, state: 'failed', error: messageOf(error) });
    }
  }
  return {
    name: skill.name,
    results,
    linked: results.filter((result) => result.state === 'linked').length,
    copied: results.filter((result) => result.state === 'copied').length,
    present: results.filter((result) => result.state === 'present').length,
    conflicts: results.filter((result) => result.state === 'conflict').length,
    failed: results.filter((result) => result.state === 'failed').length,
  };
}

/** Distribute every library skill to every enabled target. */
export async function distribute(config, options = {}) {
  const collected = await collectSkills(config, { libraryOnly: true, cwd: config.dshHome });
  const manifest = readLibraryManifest(config);
  const personal = collected.skills.filter((skill) => (manifest.skills[skill.name]?.kind ?? 'personal') === 'personal');
  const results = [];
  for (const skill of personal) {
    for (const target of enabledTargets(config)) {
      if (path.resolve(target.path) === path.resolve(config.personalDir)) {
        results.push({ name: skill.name, targetId: target.id, state: 'source', path: target.path });
        continue;
      }
      try {
        installInto(config, target, skill, options.replaceConflicts === true, results);
      } catch (error) {
        results.push({ name: skill.name, targetId: target.id, state: 'failed', error: messageOf(error) });
      }
    }
  }
  const summary = {
    at: new Date().toISOString(),
    kind: 'distribute',
    results,
    linked: results.filter((result) => result.state === 'linked').length,
    copied: results.filter((result) => result.state === 'copied').length,
    present: results.filter((result) => result.state === 'present').length,
    source: results.filter((result) => result.state === 'source').length,
    conflicts: results.filter((result) => result.state === 'conflict').length,
    failed: results.filter((result) => result.state === 'failed').length,
  };
  try {
    fs.mkdirSync(path.dirname(config.lastRestorePath), { recursive: true });
    fs.writeFileSync(config.lastRestorePath, `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
  } catch {
    // The distribution result remains useful even if the status file is unwritable.
  }
  return summary;
}

/** Materialize v2 favorites once, then ensure every library skill has v3 metadata. */
export async function migrateToLibrary(config) {
  const existing = readLibraryManifest(config);
  const favorites = readV2Favorites(config);
  const results = [];
  const pendingMeta = { ...existing.skills };
  if (Object.keys(existing.skills).length === 0 && favorites.length > 0) {
    for (const favorite of favorites) {
      addCatalogEntry(config, {
        name: favorite.name,
        source: favorite.source ?? { kind: 'unknown', reason: 'v2 favorite has no source' },
        collectedFrom: favorite.collectedFrom ?? null,
        addedAt: favorite.addedAt,
      });
      const base = libraryBase(config);
      const direct = path.join(base, favorite.name);
      const flat = path.join(base, `${favorite.name}.md`);
      const rootDirect = path.join(config.personalDir, favorite.name);
      const rootFlat = path.join(config.personalDir, `${favorite.name}.md`);
      if (fs.existsSync(direct) || fs.existsSync(flat) || fs.existsSync(rootDirect) || fs.existsSync(rootFlat)) {
        pendingMeta[favorite.name] = {
          kind: 'collected',
          favorite: true,
          source: favorite.source ?? null,
          collectedFrom: favorite.collectedFrom ?? null,
          addedAt: favorite.addedAt ?? new Date().toISOString(),
        };
        results.push({ name: favorite.name, state: 'legacy-copy' });
      } else {
        results.push({ name: favorite.name, state: 'catalog' });
      }
    }
  }

  const collected = await collectSkills(config, { libraryOnly: true, cwd: config.dshHome });
  let metadataChanged = results.length > 0;
  for (const skill of collected.skills) {
    const meta = pendingMeta[skill.name];
    if (meta !== undefined) {
      if (meta.missing === true) {
        delete meta.missing;
        metadataChanged = true;
      }
      continue;
    }
    pendingMeta[skill.name] = {
      kind: 'personal',
      favorite: false,
      source: { kind: 'personal' },
      addedAt: new Date().toISOString(),
    };
    metadataChanged = true;
  }
  if (metadataChanged) {
    writeLibraryManifest(config, { version: 3, skills: pendingMeta });
  }
  ensureCatalogFromManifest(config);
  return {
    migrated: results.length > 0,
    collected: results.filter((result) => result.state === 'collected').length,
    missing: results.filter((result) => result.state === 'missing').length,
    results,
  };
}

export function lastDistribute(config) {
  try {
    return JSON.parse(fs.readFileSync(config.lastRestorePath, 'utf8'));
  } catch {
    return null;
  }
}
