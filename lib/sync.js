/**
 * Personal library Git sync.
 *
 * The personal directory is the only content source. The repository carries
 * the skill bundles plus `.skill-hub/manifest.json`; another machine restores
 * it and then distributes to the configured agent targets.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';

import {
  catalogPath,
  effectiveConfig,
  ensureCatalogFromManifest,
  manifestPath,
  readLibraryManifest,
  readSettings,
  writeLibraryManifest,
} from './core.js';
import { distribute, migrateToLibrary } from './targets.js';
import { installCatalog, lastCatalog } from './catalog.js';

const GIT_TIMEOUT = 60_000;

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

function gitRun(cwd, args, timeout = 12000) {
  return execFileSync('/usr/bin/git', ['-c', 'core.hooksPath=/dev/null', ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function readLastRestore(config) {
  try {
    return JSON.parse(fs.readFileSync(config.lastRestorePath, 'utf8'));
  } catch {
    return null;
  }
}

function repoState(config) {
  const isRepo = fs.existsSync(path.join(config.personalDir, '.git'));
  let remote = '';
  let branch = '';
  let head = '';
  let dirty = false;
  if (isRepo) {
    try {
      remote = gitRun(config.personalDir, ['config', '--get', 'remote.origin.url']).trim();
    } catch {
      remote = '';
    }
    try {
      branch = gitRun(config.personalDir, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
    } catch {
      branch = '';
    }
    try {
      head = gitRun(config.personalDir, ['rev-parse', 'HEAD']).trim();
    } catch {
      head = '';
    }
    try {
      dirty = gitRun(config.personalDir, ['status', '--porcelain']).trim() !== '';
    } catch {
      dirty = false;
    }
  }
  return { isRepo, remote, branch, head, dirty };
}

/** Status for the sync panel; no network and no mutation. */
export function syncStatus(config) {
  const manifest = readLibraryManifest(config);
  const catalog = ensureCatalogFromManifest(config);
  const repo = repoState(config);
  const settings = readSettings(config);
  const legacyCollected = Object.values(manifest.skills).filter((meta) => meta.kind === 'collected').length;
  const skills = Object.entries(manifest.skills).map(([name, meta]) => ({
    name,
    kind: meta.kind,
    favorite: meta.favorite === true,
    sourceKind: meta.source?.kind ?? null,
    installable: meta.missing !== true,
    missing: meta.missing === true,
    reason: meta.missing === true ? 'the skill is not present in the personal library' : undefined,
    addedAt: meta.addedAt,
  }));
  const defaultPersonalDir = path.resolve(path.join(config.dshHome, 'skills'));
  return {
    personalDir: config.personalDir,
    personalDirDefault: path.resolve(config.personalDir) === defaultPersonalDir,
    settings,
    targets: config.targets,
    legacyCollected,
    repo,
    manifest: {
      path: manifestPath(config),
      count: skills.length,
      installable: skills.filter((skill) => skill.missing !== true).length,
      favorites: skills,
    },
    catalog: {
      path: catalogPath(config),
      count: catalog.entries.length,
      installable: catalog.entries.filter((entry) => entry.source.kind === 'git').length,
      entries: catalog.entries.map((entry) => ({
        name: entry.name,
        sourceKind: entry.source.kind,
        source: entry.source,
        collectedFrom: entry.collectedFrom ?? null,
      })),
    },
    lastCatalog: lastCatalog(config),
    lastRestore: readLastRestore(config),
  };
}

function emptyDirectory(directory) {
  try {
    return fs.readdirSync(directory).length === 0;
  } catch {
    return true;
  }
}

function ensureRepo(config, { allowInit }) {
  const directory = config.personalDir;
  fs.mkdirSync(directory, { recursive: true });
  if (fs.existsSync(path.join(directory, '.git'))) {
    if (config.gitRemote !== '') {
      let current = '';
      try {
        current = gitRun(directory, ['config', '--get', 'remote.origin.url']).trim();
      } catch {
        current = '';
      }
      if (current === '') {
        gitRun(directory, ['remote', 'add', 'origin', config.gitRemote]);
      } else if (current !== config.gitRemote) {
        throw new Error(`repository origin is ${current}, not ${config.gitRemote}; refusing to replace it`);
      }
    }
    return;
  }
  if (!allowInit) throw new Error('personal directory is not a Git repository');
  gitRun(directory, ['init']);
  if (config.gitRemote !== '') {
    gitRun(directory, ['remote', 'add', 'origin', config.gitRemote]);
  }
}

function stageManaged(config, { metadataOnly = false } = {}) {
  if (metadataOnly) {
    gitRun(config.personalDir, ['add', '-A', '--', '.skill-hub']);
    return;
  }
  const entries = fs
    .readdirSync(config.personalDir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .filter((entry) =>
      entry.isDirectory()
        ? fs.existsSync(path.join(config.personalDir, entry.name, 'SKILL.md'))
        : entry.isFile() && entry.name.endsWith('.md'),
    )
    .map((entry) => entry.name);
  gitRun(config.personalDir, ['add', '-A', '--', '.skill-hub']);
  if (fs.existsSync(path.join(config.personalDir, 'skills'))) {
    gitRun(config.personalDir, ['add', '-A', '--', 'skills']);
  }
  for (const name of entries) {
    gitRun(config.personalDir, ['add', '-A', '--', name]);
  }
  const tracked = gitRun(config.personalDir, ['ls-files', '-z'])
    .split('\0')
    .filter(Boolean)
    .map((file) => file.split('/')[0])
    .filter((name) => name !== '' && !name.startsWith('.'));
  for (const name of new Set(tracked)) {
    if (!entries.includes(name)) gitRun(config.personalDir, ['add', '-A', '--', name]);
  }
}

function commitManaged(config, options = {}) {
  ensureRepo(config, { allowInit: true });
  fs.mkdirSync(path.dirname(manifestPath(config)), { recursive: true });
  if (!fs.existsSync(manifestPath(config))) {
    writeLibraryManifest(config, readLibraryManifest(config));
  }
  stageManaged(config, options);
  const staged = gitRun(config.personalDir, ['diff', '--cached', '--name-only']).trim();
  let commit = null;
  if (staged !== '') {
    gitRun(config.personalDir, [
      '-c',
      'user.name=Skill Hub',
      '-c',
      'user.email=skill-hub@localhost',
      'commit',
      '-m',
      'Sync skill library',
    ]);
    commit = gitRun(config.personalDir, ['rev-parse', 'HEAD']).trim();
  } else {
    try {
      commit = gitRun(config.personalDir, ['rev-parse', 'HEAD']).trim();
    } catch {
      commit = null;
    }
  }
  return { changed: staged !== '', commit };
}

/** Commit local skill changes without contacting a remote. */
export function gitCommit(config, options = {}) {
  return commitManaged(config, options);
}

/** Commit the personal library, then fetch, fast-forward, and push when a remote exists. */
export async function gitSync(config) {
  await migrateToLibrary(config);
  writeLibraryManifest(config, readLibraryManifest(config));
  const base = commitManaged(config);
  if (config.gitRemote === '') {
    return { ...base, pulled: false, pushed: false, reason: 'no remote configured' };
  }
  const branch = config.gitBranch;
  try {
    const remoteBranch = (await runGit(config.personalDir, ['ls-remote', '--heads', 'origin', branch])).trim();
    if (remoteBranch === '') {
      await runGit(config.personalDir, ['push', '-u', 'origin', `HEAD:${branch}`]);
      return { ...base, pulled: false, pushed: true, created: true };
    }
  } catch (error) {
    return { ...base, pulled: false, pushed: false, error: `remote check failed: ${messageOf(error)}` };
  }
  try {
    await runGit(config.personalDir, ['fetch', 'origin', branch]);
  } catch (error) {
    return { ...base, pulled: false, pushed: false, error: `fetch failed: ${messageOf(error)}` };
  }
  try {
    await runGit(config.personalDir, ['pull', '--ff-only', 'origin', branch]);
  } catch (error) {
    return { ...base, pulled: false, pushed: false, error: `pull is not fast-forward: ${messageOf(error)}` };
  }
  try {
    await runGit(config.personalDir, ['push', 'origin', `HEAD:${branch}`]);
    return { ...base, pulled: true, pushed: true };
  } catch (error) {
    return { ...base, pulled: true, pushed: false, error: `push failed: ${messageOf(error)}` };
  }
}

/**
 * Restore the personal repository from its remote, then distribute the
 * restored library to the configured targets. A non-empty, non-repository
 * directory is initialized only when the remote branch is empty.
 */
export async function restorePersonal(config) {
  if (config.gitRemote === '') throw new Error('configure a Git remote before restoring');
  if (!fs.existsSync(path.join(config.personalDir, '.git'))) {
    if (!emptyDirectory(config.personalDir)) {
      let remoteBranch = '';
      try {
        remoteBranch = (
          await runGit(process.cwd(), ['ls-remote', '--heads', '--', config.gitRemote, config.gitBranch])
        ).trim();
      } catch (error) {
        throw new Error(`remote check failed: ${messageOf(error)}`);
      }
      if (remoteBranch !== '') {
        throw new Error(
          'the remote already has a library branch; move the existing personal directory aside before restoring',
        );
      }
      const sync = await gitSync(config);
      if (sync.error !== undefined) throw new Error(`initial sync failed: ${sync.error}`);
      const catalog = await installCatalog(config, { replaceConflicts: false });
      const distribution = await distribute(config, { replaceConflicts: false });
      return { repo: repoState(config), catalog, distribution, initialized: true, sync };
    }
    fs.mkdirSync(path.dirname(config.personalDir), { recursive: true });
    try {
      await runGit(process.cwd(), [
        'clone',
        '--branch',
        config.gitBranch,
        '--',
        config.gitRemote,
        config.personalDir,
      ]);
    } catch (error) {
      throw new Error(`clone failed: ${messageOf(error)}`);
    }
  } else {
    ensureRepo(config, { allowInit: false });
    try {
      await runGit(config.personalDir, ['fetch', 'origin', config.gitBranch]);
      await runGit(config.personalDir, ['pull', '--ff-only', 'origin', config.gitBranch]);
    } catch (error) {
      throw new Error(`pull is not fast-forward: ${messageOf(error)}`);
    }
  }
  await migrateToLibrary(config);
  ensureCatalogFromManifest(config);
  const catalog = await installCatalog(config, { replaceConflicts: false });
  const distribution = await distribute(config, { replaceConflicts: false });
  return { repo: repoState(config), catalog, distribution };
}

/** Whether the configured personal directory is the default DSH-scanned root. */
export function personalDirWarning(config) {
  const expected = path.resolve(path.join(config.dshHome, 'skills'));
  if (path.resolve(config.personalDir) === expected) return undefined;
  return `personal directory is ${config.personalDir}, not ${expected}; DSH loads it only if it is a scanned root (customSkillDirs)`;
}

export { effectiveConfig };
