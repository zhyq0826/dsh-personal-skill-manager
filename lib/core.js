/**
 * Skill library domain core.
 *
 * The library is a projection over the skill roots that DSH itself scans. A
 * skill is identified by its name plus the exact instruction file it resolved
 * from; same-name entries in different roots stay distinct, and the winner DSH
 * would load is reported rather than silently merged.
 *
 * Writes only touch a path that a fresh scan resolved, only inside a known
 * root, and never through a symbolic link. Destructive changes keep a backup:
 * edits copy the previous SKILL.md, deletes move the entry to the plugin trash
 * instead of removing it.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MAX_NAME_LENGTH = 64;
const DEFAULT_MAX_CONTENT_BYTES = 256 * 1024;
const DEFAULT_MAX_BUNDLE_FILES = 500;
const DEFAULT_MAX_BUNDLE_BYTES = 8 * 1024 * 1024;
const SCAN_FILE_LIMIT = 1024 * 1024;

/** Display and precedence metadata for every root class. */
export const GROUPS = [
  {
    key: 'personal',
    title: 'My skills',
    hint: '~/.dsh/skills',
    priority: 3,
    writable: true,
  },
  {
    key: 'project-dsh',
    title: 'Project skills (.dsh/skills)',
    hint: 'Current project only',
    priority: 0,
    writable: true,
  },
  {
    key: 'project-agents',
    title: 'Project skills (.agents/skills)',
    hint: 'Current project only',
    priority: 1,
    writable: true,
  },
  {
    key: 'custom',
    title: 'Custom directories',
    hint: 'Configured extra roots',
    priority: 2,
    writable: true,
  },
  {
    key: 'shared',
    title: 'Shared agent skills',
    hint: '~/.agents/skills',
    priority: 4,
    writable: true,
  },
  {
    key: 'bundled',
    title: 'Bundled skills',
    hint: 'Shipped with DSH and plugins',
    priority: 6,
    writable: false,
  },
  {
    key: 'runtime',
    title: 'Runtime skills',
    hint: 'Registered in plugin code',
    priority: 250,
    writable: false,
  },
  {
    key: 'other',
    title: 'Other sources',
    hint: 'Unknown provider roots',
    priority: 300,
    writable: false,
  },
];

const GROUP_BY_KEY = new Map(GROUPS.map((group) => [group.key, group]));

/** Return the display metadata for one group key. */
export function groupInfo(key) {
  return GROUP_BY_KEY.get(key) ?? GROUP_BY_KEY.get('other');
}

/** Whether a string is a valid kebab-case skill name. */
export function isValidSkillName(name) {
  return typeof name === 'string' && name.length > 0 && name.length <= MAX_NAME_LENGTH && NAME_PATTERN.test(name);
}

function expandHome(value) {
  if (typeof value !== 'string') return value;
  if (value === '~') return os.homedir();
  if (value.startsWith('~/') || value.startsWith('~\\')) return path.join(os.homedir(), value.slice(2));
  return value;
}

/** Resolve plugin configuration without reading the profile patch. */
export function resolveConfig(raw = {}) {
  const dshHome = path.resolve(expandHome(raw.dshHome ?? process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh')));
  const agentsHome = path.resolve(expandHome(raw.agentsHome ?? process.env.DSH_AGENTS_HOME ?? path.join(os.homedir(), '.agents')));
  const bundledDir = raw.bundledSkillDir ?? process.env.DSH_BUNDLED_SKILL_DIR;
  const expandedBundled = bundledDir === undefined ? undefined : expandHome(bundledDir);
  const customSkillDirs = (Array.isArray(raw.customSkillDirs) ? raw.customSkillDirs : [])
    .filter((entry) => typeof entry === 'string' && entry.trim() !== '')
    .map((entry) => path.resolve(expandHome(entry)));
  const stateDir = path.join(dshHome, 'skill-hub');
  const personalDir = path.resolve(expandHome(raw.personalDir ?? path.join(dshHome, 'skills')));
  const clamp = (value, fallback, min, max) =>
    Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  return {
    dshHome,
    agentsHome,
    bundledDir: expandedBundled === undefined ? undefined : path.resolve(expandedBundled),
    customSkillDirs,
    stateDir,
    personalDir,
    favoritesPath: path.join(stateDir, 'favorites.json'),
    settingsPath: path.join(stateDir, 'settings.json'),
    lastRestorePath: path.join(stateDir, 'last-restore.json'),
    lastCatalogPath: path.join(stateDir, 'last-catalog.json'),
    backupDir: path.join(stateDir, 'backups'),
    trashDir: path.join(stateDir, 'trash'),
    importsDir: path.join(stateDir, 'imports'),
    lockFile: path.join(agentsHome, '.skill-lock.json'),
    maxContentBytes: clamp(raw.maxContentBytes, DEFAULT_MAX_CONTENT_BYTES, 4096, 2 * 1024 * 1024),
    maxBundleFiles: clamp(raw.maxBundleFiles, DEFAULT_MAX_BUNDLE_FILES, 1, 5000),
    maxBundleBytes: clamp(raw.maxBundleBytes, DEFAULT_MAX_BUNDLE_BYTES, 1024, 64 * 1024 * 1024),
    includeShared: raw.includeShared !== false,
  };
}


const DEFAULT_SETTINGS = {
  personalDir: null,
  gitRemote: '',
  gitBranch: 'main',
  autoInstall: false,
  autoDistribute: false,
  autoSync: false,
};

const BRANCH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

function sanitizeRemote(value) {
  if (typeof value !== 'string') return '';
  const remote = value.trim();
  if (remote === '' || /[\r\n\u0000]/.test(remote) || remote.startsWith('-')) return '';
  return remote;
}

function sanitizeBranch(value) {
  if (typeof value !== 'string') return 'main';
  const branch = value.trim();
  return BRANCH_PATTERN.test(branch) && !branch.startsWith('-') ? branch : 'main';
}


/** Default installation targets for the common code agents. */
export function defaultTargets(config) {
  const home = os.homedir();
  return [
    { id: 'codex', label: 'Codex', path: path.join(home, '.codex', 'skills'), mode: 'link', enabled: true },
    { id: 'claude', label: 'Claude Code', path: path.join(home, '.claude', 'skills'), mode: 'link', enabled: true },
    { id: 'cursor', label: 'Cursor', path: path.join(home, '.cursor', 'skills'), mode: 'link', enabled: true },
    { id: 'dsh', label: 'DSH', path: path.join(config.dshHome, 'skills'), mode: 'link', enabled: true },
    { id: 'agents', label: 'Shared agent skills', path: path.join(config.agentsHome, 'skills'), mode: 'link', enabled: false },
  ];
}

function sanitizeTargets(config, value) {
  if (!Array.isArray(value)) return defaultTargets(config);
  const seen = new Set();
  const targets = [];
  for (const candidate of value) {
    if (candidate === null || typeof candidate !== 'object') continue;
    const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
    const targetPath = typeof candidate.path === 'string' ? candidate.path.trim() : '';
    if (id === '' || targetPath === '' || seen.has(id)) continue;
    seen.add(id);
    targets.push({
      id,
      label: typeof candidate.label === 'string' && candidate.label !== '' ? candidate.label : id,
      path: path.resolve(expandHome(targetPath)),
      mode: candidate.mode === 'copy' ? 'copy' : 'link',
      enabled: candidate.enabled !== false,
    });
  }
  return targets.length === 0 ? defaultTargets(config) : targets;
}

/** Machine-local settings; never committed to the personal repository. */
export function readSettings(config) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(config.settingsPath, 'utf8'));
  } catch {
    parsed = undefined;
  }
  const source = parsed !== null && typeof parsed === 'object' ? parsed : {};
  const personalDir =
    typeof source.personalDir === 'string' && source.personalDir.trim() !== ''
      ? path.resolve(expandHome(source.personalDir))
      : null;
  return {
    personalDir,
    gitRemote: sanitizeRemote(source.gitRemote),
    gitBranch: sanitizeBranch(source.gitBranch),
    autoInstall: source.autoInstall === true,
    autoDistribute: source.autoDistribute === true,
    autoSync: source.autoSync === true,
    targets: sanitizeTargets(config, source.targets),
  };
}

/** Persist machine-local settings and return the normalized result. */
export function writeSettings(config, patch) {
  const current = readSettings(config);
  const next = {
    personalDir:
      patch.personalDir === undefined
        ? current.personalDir
        : typeof patch.personalDir === 'string' && patch.personalDir.trim() !== ''
          ? path.resolve(expandHome(patch.personalDir))
          : null,
    gitRemote: patch.gitRemote === undefined ? current.gitRemote : sanitizeRemote(patch.gitRemote),
    gitBranch: patch.gitBranch === undefined ? current.gitBranch : sanitizeBranch(patch.gitBranch),
    autoInstall: patch.autoInstall === undefined ? current.autoInstall : patch.autoInstall === true,
    autoDistribute:
      patch.autoDistribute === undefined ? current.autoDistribute : patch.autoDistribute === true,
    autoSync: patch.autoSync === undefined ? current.autoSync : patch.autoSync === true,
    targets:
      patch.targets === undefined ? current.targets : sanitizeTargets(config, patch.targets),
  };
  writeAtomic(config.settingsPath, `${JSON.stringify({ version: 1, ...next }, null, 2)}\n`, 0o600);
  return next;
}



function normalizeCatalogEntry(item) {
  if (item === null || typeof item !== 'object') return undefined;
  if (typeof item.name !== 'string' || !isValidSkillName(item.name)) return undefined;
  const source = item.source;
  if (source === null || typeof source !== 'object') return undefined;
  if (source.kind !== 'personal' && source.kind !== 'git' && source.kind !== 'unknown') return undefined;
  if (source.kind === 'git') {
    if (
      typeof source.repository !== 'string' ||
      source.repository === '' ||
      typeof source.revision !== 'string' ||
      !/^[a-f0-9]{40,64}$/.test(source.revision) ||
      typeof source.subpath !== 'string' ||
      path.isAbsolute(source.subpath) ||
      source.subpath.split(/[\\/]/).includes('..')
    ) {
      return undefined;
    }
  }
  return {
    name: item.name,
    source: { ...source },
    collectedFrom:
      item.collectedFrom !== null &&
      typeof item.collectedFrom === 'object' &&
      typeof item.collectedFrom.id === 'string'
        ? item.collectedFrom
        : null,
    addedAt: typeof item.addedAt === 'string' ? item.addedAt : new Date().toISOString(),
  };
}

/** Portable catalog of community favorites; it stores sources, not content. */
export function catalogPath(config) {
  return path.join(config.personalDir, '.skill-hub', 'catalog.json');
}

export function readCatalog(config) {
  try {
    const parsed = JSON.parse(fs.readFileSync(catalogPath(config), 'utf8'));
    if (parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.entries)) {
      return {
        version: 1,
        entries: parsed.entries.map(normalizeCatalogEntry).filter(Boolean),
      };
    }
  } catch {
    // Missing catalog.
  }
  return { version: 1, entries: [] };
}

export function writeCatalog(config, catalog) {
  const file = catalogPath(config);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  writeAtomic(
    file,
    `${JSON.stringify({ version: 1, entries: catalog.entries ?? [] }, null, 2)}\n`,
    0o644,
  );
}

/** Move legacy v3 collected entries into the catalog without copying content. */
export function ensureCatalogFromManifest(config) {
  const catalog = readCatalog(config);
  const manifest = readLibraryManifest(config);
  const known = new Set(catalog.entries.map((entry) => entry.name));
  let changed = false;
  for (const [name, meta] of Object.entries(manifest.skills)) {
    if (meta.kind !== 'collected' || known.has(name)) continue;
    catalog.entries.push({
      name,
      source: meta.source ?? { kind: 'unknown', reason: 'legacy collected entry has no source' },
      collectedFrom: meta.collectedFrom ?? null,
      addedAt: meta.addedAt,
    });
    known.add(name);
    changed = true;
  }
  if (changed) writeCatalog(config, catalog);
  return catalog;
}

export function addCatalogEntry(config, entry) {
  const catalog = readCatalog(config);
  const normalized = normalizeCatalogEntry({ ...entry, addedAt: entry.addedAt ?? new Date().toISOString() });
  if (normalized === undefined) throw new Error('invalid catalog entry');
  catalog.entries = catalog.entries.filter((candidate) => candidate.name !== normalized.name);
  catalog.entries.push(normalized);
  writeCatalog(config, catalog);
  return normalized;
}

export function removeCatalogEntry(config, name) {
  const catalog = readCatalog(config);
  const next = catalog.entries.filter((entry) => entry.name !== name);
  writeCatalog(config, { version: 1, entries: next });
  return next.length !== catalog.entries.length;
}

/** The directory that directly contains skill bundles; prefers `<repo>/skills`. */
export function libraryBase(config) {
  const nested = path.join(config.personalDir, 'skills');
  try {
    if (fs.statSync(nested).isDirectory()) return nested;
  } catch {
    // No nested skills directory.
  }
  return config.personalDir;
}

/** Resolve the effective configuration after machine settings are applied. */
export function effectiveConfig(config) {
  const settings = readSettings(config);
  return {
    ...config,
    personalDir: settings.personalDir ?? config.personalDir,
    gitRemote: settings.gitRemote,
    gitBranch: settings.gitBranch,
    autoInstall: settings.autoInstall,
    autoDistribute: settings.autoDistribute,
    autoSync: settings.autoSync,
    targets: settings.targets,
    settings,
  };
}

/** Portable selection manifest; lives inside the personal Git repository. */
export function manifestPath(config) {
  return path.join(config.personalDir, '.skill-hub', 'manifest.json');
}

function normalizeFavorite(item) {
  if (item === null || typeof item !== 'object') return undefined;
  if (typeof item.name !== 'string' || !isValidSkillName(item.name)) return undefined;
  const source = item.source;
  if (source === null || typeof source !== 'object') return undefined;
  if (source.kind !== 'personal' && source.kind !== 'git' && source.kind !== 'unknown') return undefined;
  if (source.kind === 'git') {
    if (
      typeof source.repository !== 'string' ||
      source.repository === '' ||
      typeof source.revision !== 'string' ||
      !/^[a-f0-9]{40,64}$/.test(source.revision) ||
      typeof source.subpath !== 'string' ||
      path.isAbsolute(source.subpath) ||
      source.subpath.split(/[\\/]/).includes('..')
    ) {
      return undefined;
    }
  }
  return {
    name: item.name,
    kind: source.kind === 'personal' ? 'personal' : 'community',
    source: { ...source },
    addedAt: typeof item.addedAt === 'string' ? item.addedAt : new Date().toISOString(),
  };
}

function readLegacyFavorites(config) {
  try {
    const parsed = JSON.parse(fs.readFileSync(config.favoritesPath, 'utf8'));
    if (parsed === null || typeof parsed !== 'object' || !Array.isArray(parsed.items)) return [];
    return parsed.items.filter(
      (item) => item !== null && typeof item === 'object' && typeof item.name === 'string',
    );
  } catch {
    return [];
  }
}

/** Read the portable manifest, migrating the old machine-local favorites once. */
export function readManifest(config) {
  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath(config), 'utf8'));
    if (parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.favorites)) {
      return {
        version: 2,
        favorites: parsed.favorites.map(normalizeFavorite).filter(Boolean),
      };
    }
  } catch {
    // Missing or malformed manifest falls through to migration or empty state.
  }
  const legacy = readLegacyFavorites(config);
  if (legacy.length === 0) return { version: 2, favorites: [] };
  const favorites = [];
  for (const item of legacy) {
    const entry = {
      name: item.name,
      path: typeof item.path === 'string' ? item.path : undefined,
      group: item.path !== undefined && isInside(config.personalDir, item.path) ? 'personal' : 'community',
    };
    favorites.push(favoriteForEntry(config, entry));
  }
  const migrated = { version: 2, favorites };
  try {
    writeManifest(config, migrated);
  } catch {
    // A read must not fail because the migration could not be persisted.
  }
  return migrated;
}

/** Persist the portable manifest in the personal repository. */
export function writeManifest(config, manifest) {
  const file = manifestPath(config);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  writeAtomic(file, `${JSON.stringify({ version: 2, favorites: manifest.favorites }, null, 2)}\n`, 0o644);
}


/** v3 manifest: the library is the single source; metadata is portable. */
export function readLibraryManifest(config) {
  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath(config), 'utf8'));
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      parsed.version === 3 &&
      parsed.skills !== null &&
      typeof parsed.skills === 'object'
    ) {
      const skills = {};
      for (const [name, meta] of Object.entries(parsed.skills)) {
        if (!isValidSkillName(name) || meta === null || typeof meta !== 'object') continue;
        skills[name] = {
          kind: meta.kind === 'collected' ? 'collected' : 'personal',
          favorite: meta.favorite === true,
          source: meta.source ?? null,
          collectedFrom:
            meta.collectedFrom !== null &&
            typeof meta.collectedFrom === 'object' &&
            typeof meta.collectedFrom.id === 'string'
              ? meta.collectedFrom
              : null,
          addedAt: typeof meta.addedAt === 'string' ? meta.addedAt : new Date().toISOString(),
          ...(meta.missing === true ? { missing: true } : {}),
        };
      }
      return { version: 3, skills };
    }
  } catch {
    // Missing or v2 manifest; migration owns the transition.
  }
  return { version: 3, skills: {} };
}

export function writeLibraryManifest(config, manifest) {
  const file = manifestPath(config);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  writeAtomic(
    file,
    `${JSON.stringify({ version: 3, skills: manifest.skills ?? {} }, null, 2)}\n`,
    0o644,
  );
}

export function setSkillMeta(config, name, meta) {
  const manifest = readLibraryManifest(config);
  manifest.skills[name] = {
    kind: meta.kind === 'collected' ? 'collected' : 'personal',
    favorite: meta.favorite === true,
    source: meta.source ?? null,
    collectedFrom:
      meta.collectedFrom !== null &&
      typeof meta.collectedFrom === 'object' &&
      typeof meta.collectedFrom.id === 'string'
        ? meta.collectedFrom
        : null,
    addedAt: meta.addedAt ?? new Date().toISOString(),
    ...(meta.missing === true ? { missing: true } : {}),
  };
  writeLibraryManifest(config, manifest);
  return manifest.skills[name];
}

/** Strict v2 favorites for the one-time materialization migration. */
export function readV2Favorites(config) {
  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath(config), 'utf8'));
    if (parsed !== null && typeof parsed === 'object' && parsed.version === 2 && Array.isArray(parsed.favorites)) {
      return parsed.favorites
        .filter((item) => item !== null && typeof item === 'object' && typeof item.name === 'string')
        .map((item) => ({ ...item }));
    }
  } catch {
    // No v2 manifest.
  }
  return [];
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


function readSkillLock(config) {
  try {
    const parsed = JSON.parse(fs.readFileSync(config.lockFile, 'utf8'));
    if (parsed === null || typeof parsed !== 'object' || parsed.skills === null || typeof parsed.skills !== 'object') {
      return undefined;
    }
    return parsed.skills;
  } catch {
    return undefined;
  }
}

/**
 * Use the shared `.skill-lock.json` as a source hint. The lock does not record
 * a commit, so the current remote HEAD is pinned at favorite time; the content
 * hash in the lock is informational, not a reconstruction input.
 */
function resolveLockSource(config, name) {
  const skills = readSkillLock(config);
  const record = skills?.[name];
  if (record === null || typeof record !== 'object') return undefined;
  let repository = typeof record.sourceUrl === 'string' ? record.sourceUrl.trim() : '';
  if (repository === '' && record.sourceType === 'github' && typeof record.source === 'string') {
    repository = `https://github.com/${record.source}.git`;
  }
  if (repository === '' || /^[a-z]+:\/\/[^/]*@/i.test(repository)) return undefined;
  const skillPath = typeof record.skillPath === 'string' && record.skillPath !== '' ? record.skillPath : 'SKILL.md';
  const subpath = path.posix.dirname(skillPath);
  if (subpath.split('/').includes('..')) return undefined;
  try {
    const output = gitRun(process.cwd(), ['ls-remote', '--', repository, 'HEAD'], 6_000).trim();
    const revision = output.split(/\s+/)[0] ?? '';
    if (!/^[a-f0-9]{40,64}$/.test(revision)) return undefined;
    return {
      kind: 'git',
      repository,
      revision,
      subpath: subpath === '.' ? '' : subpath,
      flat: false,
      origin: 'lock',
    };
  } catch {
    return undefined;
  }
}

/**
 * Resolve where a non-personal skill came from. Only a clean, tracked Git
 * worktree with an origin remote and a full commit can be installed later.
 */
export function resolveSource(config, entry) {
  if (entry.group === 'personal') return { kind: 'personal' };
  if (entry.path === undefined) return { kind: 'unknown', reason: 'no instruction file' };
  let real;
  try {
    real = fs.realpathSync(entry.path);
  } catch {
    return { kind: 'unknown', reason: 'instruction file is not readable' };
  }
  if (isInside(config.personalDir, real)) return { kind: 'personal' };
  const directory = path.dirname(real);
  let top;
  try {
    top = gitRun(directory, ['rev-parse', '--show-toplevel']).trim();
  } catch {
    const locked = resolveLockSource(config, entry.name);
    return locked ?? { kind: 'unknown', reason: 'no local Git worktree and no usable .skill-lock.json record' };
  }
  try {
    const revision = gitRun(directory, ['rev-parse', 'HEAD']).trim();
    const repository = gitRun(directory, ['config', '--get', 'remote.origin.url']).trim();
    const dirty = gitRun(directory, ['status', '--porcelain', '--untracked-files=all', '--', '.']).trim();
    const tracked = gitRun(directory, [
      'ls-files',
      '--',
      entry.flat ? path.basename(real) : 'SKILL.md',
    ]).trim();
    if (dirty !== '') return { kind: 'unknown', reason: 'working tree has uncommitted changes' };
    if (tracked === '') return { kind: 'unknown', reason: 'instruction file is not tracked by Git' };
    if (repository === '') {
      const locked = resolveLockSource(config, entry.name);
      return locked ?? { kind: 'unknown', reason: 'Git repository has no origin remote' };
    }
    if (/^[a-z]+:\/\/[^/]*@/i.test(repository)) {
      return { kind: 'unknown', reason: 'remote URL contains credentials' };
    }
    if (!/^[a-f0-9]{40,64}$/.test(revision)) {
      return { kind: 'unknown', reason: 'HEAD is not a full commit hash' };
    }
    const subpath = entry.flat
      ? path.relative(top, real).split(path.sep).join('/')
      : path.relative(top, directory).split(path.sep).join('/');
    if (subpath.split('/').includes('..')) {
      return { kind: 'unknown', reason: 'skill is outside its Git worktree' };
    }
    return {
      kind: 'git',
      repository,
      revision,
      subpath,
      flat: entry.flat === true,
    };
  } catch {
    return { kind: 'unknown', reason: 'no verifiable Git origin, commit, and clean subpath' };
  }
}

/** Build the portable favorite record for one scanned entry. */
export function favoriteForEntry(config, entry) {
  const source =
    entry.group === 'personal' || (entry.path !== undefined && isInside(config.personalDir, entry.path))
      ? { kind: 'personal' }
      : resolveSource(config, entry);
  return {
    name: entry.name,
    kind: source.kind === 'personal' ? 'personal' : 'community',
    source,
    addedAt: new Date().toISOString(),
  };
}


/** Find the nearest ancestor containing .git, or the starting directory. */
export function findProjectRoot(cwd) {
  let current = path.resolve(cwd);
  for (;;) {
    if (fs.existsSync(path.join(current, '.git'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(cwd);
    current = parent;
  }
}

/** Active Session workspace directories, or an empty list when unavailable. */
export function sessionCwds(ctx) {
  try {
    const sessions = ctx?.sessions?.list?.();
    if (!Array.isArray(sessions)) return [];
    return sessions
      .map((session) => session?.header?.cwd)
      .filter((cwd) => typeof cwd === 'string' && cwd !== '');
  } catch {
    return [];
  }
}

/** Unique project roots for a set of workspace directories. */
export function projectRootsFor(cwds, fallbackCwd) {
  const roots = new Set();
  for (const cwd of cwds) roots.add(findProjectRoot(cwd));
  if (roots.size === 0) roots.add(findProjectRoot(fallbackCwd ?? process.cwd()));
  return [...roots];
}

/** Whether a target is lexically inside a root. */
export function isInside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function assertInside(root, target) {
  if (!isInside(root, target)) throw new Error(`refusing to touch a path outside ${root}`);
}

function assertNotLinked(entry) {
  if (entry.linked) throw new Error(`skill "${entry.name}" is a symbolic link; edit its target directly`);
}

function assertEditable(entry) {
  if (!entry.path) throw new Error(`skill "${entry.name}" has no instruction file`);
  assertNotLinked(entry);
  if (!entry.editable) throw new Error(`skill "${entry.name}" belongs to a read-only source`);
}

/** Parse a YAML boolean in the forms the DSH skill provider accepts. */
function parseYamlBoolean(value) {
  const text = String(value).trim().toLowerCase();
  if (['true', 'yes', 'on', '1'].includes(text)) return true;
  if (['false', 'no', 'off', '0'].includes(text)) return false;
  return undefined;
}

function unquote(value) {
  const text = value.trim();
  if (text.length >= 2 && text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replaceAll("''", "'");
  }
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    try {
      return JSON.parse(text);
    } catch {
      return text.slice(1, -1);
    }
  }
  return text;
}

/**
 * Read the frontmatter fields this library exposes. The parser is deliberately
 * smaller than YAML: it understands scalars, quoted scalars, block scalars,
 * and the invocation booleans. The DSH filesystem provider remains the
 * authority for whether a skill loads.
 */
export function parseFrontmatter(content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n)?([\s\S]*)$/.exec(content);
  if (match === null) {
    return { hasFrontmatter: false, body: content };
  }
  const block = match[1];
  const body = match[2] ?? '';
  const lines = block.split(/\r?\n/);
  const fields = { hasFrontmatter: true, body };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const pair = /^([A-Za-z][\w-]*):[ \t]*(.*)$/.exec(line);
    if (pair === null) continue;
    const key = pair[1];
    const rest = pair[2].trim();
    if (/^[|>][-+]?$/u.test(rest)) {
      const collected = [];
      for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
        const next = lines[cursor];
        if (next === '' || /^\s/.test(next)) collected.push(next.replace(/^\s{1,}/, ''));
        else break;
      }
      const joined = rest.startsWith('>') ? collected.join(' ').trim() : collected.join('\n').trim();
      if (key === 'name') fields.name = joined || undefined;
      else if (key === 'description') fields.description = joined || undefined;
      else if (key === 'whenToUse' || key === 'when-to-use') fields.whenToUse = joined || undefined;
      continue;
    }
    if (rest === '') continue;
    const value = unquote(rest);
    if (key === 'name') fields.name = value;
    else if (key === 'description') fields.description = value;
    else if (key === 'whenToUse' || key === 'when-to-use') fields.whenToUse = value;
    else if (key === 'disable-model-invocation') fields.disableModelInvocation = parseYamlBoolean(value);
    else if (key === 'user-invocable') fields.userInvocable = parseYamlBoolean(value);
  }
  return fields;
}

/** First readable body line, used as a fallback description. */
export function fallbackDescription(content) {
  const { body } = parseFrontmatter(content);
  for (const line of body.split(/\r?\n/)) {
    const text = line.trim();
    if (text === '' || text.startsWith('#')) continue;
    return text.replace(/\s+/g, ' ').slice(0, 240);
  }
  return '';
}

function yamlString(value) {
  return `'${String(value).replace(/\r?\n/g, ' ').trim().replaceAll("'", "''")}'`;
}

/**
 * Rewrite only the requested frontmatter fields, preserving every other line
 * and the body verbatim. Boolean fields are removed when they match the
 * provider default, so a clean file stays clean.
 */
export function setFrontmatterFields(content, updates) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?([\s\S]*)$/.exec(content);
  if (match === null) throw new Error('SKILL.md has no frontmatter block');
  let lines = match[1].split(/\r?\n/);
  const body = match[2] ?? '';
  const replaceOrAppend = (field, next) => {
    const pattern = new RegExp(`^${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`);
    const index = lines.findIndex((line) => pattern.test(line));
    if (next === undefined) {
      if (index >= 0) lines = lines.filter((_line, cursor) => cursor !== index);
      return;
    }
    if (index >= 0) lines[index] = `${field}: ${next}`;
    else lines.push(`${field}: ${next}`);
  };
  if (updates.description !== undefined) {
    replaceOrAppend('description', updates.description === '' ? undefined : yamlString(updates.description));
  }
  if (updates.whenToUse !== undefined) {
    replaceOrAppend('whenToUse', updates.whenToUse ? yamlString(updates.whenToUse) : undefined);
  }
  if (updates.modelInvocable !== undefined) {
    replaceOrAppend('disable-model-invocation', updates.modelInvocable ? undefined : 'true');
  }
  if (updates.userInvocable !== undefined) {
    replaceOrAppend('user-invocable', updates.userInvocable ? undefined : 'false');
  }
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

/** Build a new SKILL.md from normalized fields. */
export function buildSkillFile({ name, description, whenToUse, content, disableModelInvocation, userInvocable }) {
  const lines = ['---', `name: ${name}`, `description: ${yamlString(description)}`];
  if (whenToUse) lines.push(`whenToUse: ${yamlString(whenToUse)}`);
  if (disableModelInvocation === true) lines.push('disable-model-invocation: true');
  if (userInvocable === false) lines.push('user-invocable: false');
  lines.push('---', '', String(content).trim(), '');
  return lines.join('\n');
}

/** Stable content digest used to reject stale editor buffers. */
export function digest(content) {
  return createHash('sha256').update(content).digest('hex');
}

function writeAtomic(file, content, mode = 0o600) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomBytes(6).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(temp, content, { encoding: 'utf8', flag: 'wx', mode });
    fs.renameSync(temp, file);
  } catch (error) {
    try {
      fs.unlinkSync(temp);
    } catch {
      // Best effort cleanup; the original error is the useful one.
    }
    throw error;
  }
}

function readBounded(file, limit) {
  const stat = fs.statSync(file);
  if (!stat.isFile()) throw new Error(`${file} is not a regular file`);
  if (stat.size > limit) throw new Error(`${file} exceeds the ${limit}-byte read limit`);
  return fs.readFileSync(file, 'utf8');
}

function backupSkillFile(config, entry, content) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const directory = path.join(config.backupDir, `${stamp}-${entry.name}-${randomBytes(3).toString('hex')}`);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'SKILL.md'), content, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  return directory;
}

async function scanRoot(root, group, completeRef, into, projectRoot) {
  let entries;
  try {
    entries = await fsp.readdir(root, { withFileTypes: true });
  } catch {
    return;
  }
  await Promise.all(
    entries.map(async (dirent) => {
      const name = dirent.name;
      if (name.startsWith('.')) return;
      let file;
      let linked = false;
      try {
        if (dirent.isDirectory()) {
          file = path.join(root, name, 'SKILL.md');
        } else if (dirent.isFile() && name.endsWith('.md')) {
          file = path.join(root, name);
        } else if (dirent.isSymbolicLink()) {
          linked = true;
          const target = await fsp.stat(path.join(root, name));
          if (target.isDirectory()) file = path.join(root, name, 'SKILL.md');
          else if (target.isFile() && name.endsWith('.md')) file = path.join(root, name);
          else return;
        } else {
          return;
        }
        if (!fs.existsSync(file)) return;
        const fileStat = await fsp.lstat(file);
        if (fileStat.isSymbolicLink()) linked = true;
        const stat = await fsp.stat(file);
        if (!stat.isFile()) return;
        if (stat.size > SCAN_FILE_LIMIT) {
          completeRef.value = false;
          return;
        }
        const content = await fsp.readFile(file, 'utf8');
        const parsed = parseFrontmatter(content);
        const skillName = parsed.name ?? (dirent.isDirectory() ? name : name.replace(/\.md$/u, ''));
        if (!isValidSkillName(skillName)) return;
        if (into.has(file)) return;
        into.set(file, {
          name: skillName,
          description: parsed.description ?? fallbackDescription(content) ?? '',
          whenToUse: parsed.whenToUse,
          path: file,
          group,
          source: 'filesystem',
          provider: 'filesystem',
          linked,
          root,
          projectRoot,
          scopeKey: projectRoot === undefined ? 'global' : `project:${projectRoot}`,
          flat: path.basename(file) !== 'SKILL.md',
          modelInvocable: parsed.disableModelInvocation !== true,
          userInvocable: parsed.userInvocable !== false,
          editable: groupInfo(group).writable === true && linked === false,
          deletable: groupInfo(group).writable === true && linked === false,
          bytes: Buffer.byteLength(content),
          digest: digest(content),
          favorite: false,
          shadowed: false,
          duplicateCount: 1,
        });
      } catch {
        completeRef.value = false;
      }
    }),
  );
}

function registryGroup(skill) {
  const source = typeof skill.source === 'string' ? skill.source : '';
  if (GROUP_BY_KEY.has(source)) return source;
  if (source === 'user-dsh') return 'personal';
  if (source === 'user-agents') return 'shared';
  if (source.startsWith('project')) return 'project-dsh';
  if (skill.provider === 'runtime') return 'runtime';
  return source === '' ? 'runtime' : 'other';
}

async function mergeRegistry(registry, cwd, completeRef, byPath, additions) {
  if (registry === undefined || typeof registry.snapshot !== 'function') return;
  try {
    const snapshot = await registry.snapshot({ cwd });
    if (snapshot?.complete !== true) completeRef.value = false;
    for (const summary of snapshot?.skills ?? []) {
      if (summary === null || typeof summary.name !== 'string') continue;
      const existing =
        typeof summary.path === 'string'
          ? [...byPath.values()].find((entry) => entry.path === summary.path)
          : undefined;
      if (existing !== undefined) {
        existing.provider = summary.provider ?? existing.provider;
        if (summary.whenToUse !== undefined) existing.whenToUse = summary.whenToUse;
        if (summary.invocation !== undefined) {
          existing.modelInvocable = summary.invocation.modelInvocable === true;
          existing.userInvocable = summary.invocation.userInvocable === true;
        }
        continue;
      }
      const group = registryGroup(summary);
      if (group === 'personal' || group === 'shared' || group.startsWith('project') || group === 'custom') {
        // A filesystem entry would have been scanned already; a registry-only
        // entry under a writable root has no verifiable file path, so it stays
        // listed but not editable.
      }
      additions.push({
        name: summary.name,
        description: summary.description ?? '',
        whenToUse: summary.whenToUse,
        path: typeof summary.path === 'string' ? summary.path : undefined,
        group,
        source: 'registry',
        provider: summary.provider ?? 'registry',
        linked: false,
        flat: false,
        projectRoot: undefined,
        scopeKey: 'global',
        modelInvocable: summary.invocation?.modelInvocable === true,
        userInvocable: summary.invocation?.userInvocable === true,
        editable: false,
        deletable: false,
        bytes: 0,
        digest: undefined,
        favorite: false,
        shadowed: false,
        duplicateCount: 1,
      });
    }
  } catch {
    completeRef.value = false;
  }
}

function shortPath(file) {
  const home = os.homedir();
  return file.startsWith(`${home}${path.sep}`) ? `~/${file.slice(home.length + 1)}` : file;
}

/**
 * Collect one observation of the skill library.
 *
 * @param config resolved plugin config
 * @param options cwd, explicit project roots, and the optional skill registry
 * @returns skills (all entries, not deduplicated), groups, and completeness
 */
export async function collectSkills(config, options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const roots =
    Array.isArray(options.projectRoots) && options.projectRoots.length > 0
      ? [...new Set(options.projectRoots.map((root) => path.resolve(root)))]
      : [findProjectRoot(cwd)];
  const completeRef = { value: true };
  const byPath = new Map();
  const additions = [];
  const tasks = [];
  if (options.libraryOnly === true) {
    await scanRoot(config.personalDir, 'personal', completeRef, byPath);
    const nested = libraryBase(config);
    if (nested !== config.personalDir) {
      await scanRoot(nested, 'personal', completeRef, byPath);
    }
  } else {
  for (const root of roots) {
    tasks.push(scanRoot(path.join(root, '.dsh', 'skills'), 'project-dsh', completeRef, byPath, root));
    tasks.push(scanRoot(path.join(root, '.agents', 'skills'), 'project-agents', completeRef, byPath, root));
  }
  for (const directory of config.customSkillDirs) {
    tasks.push(scanRoot(directory, 'custom', completeRef, byPath));
  }
  tasks.push(scanRoot(config.personalDir, 'personal', completeRef, byPath));
  if (config.includeShared) {
    tasks.push(scanRoot(path.join(config.agentsHome, 'skills'), 'shared', completeRef, byPath));
  }
  if (config.bundledDir !== undefined) {
    tasks.push(scanRoot(config.bundledDir, 'bundled', completeRef, byPath));
  }
  }
  await Promise.all(tasks);
  if (options.libraryOnly !== true) {
    await mergeRegistry(options.registry, cwd, completeRef, byPath, additions);
  }

  const skills = [...byPath.values(), ...additions];
  const manifest = readLibraryManifest(config);
  for (const skill of skills) {
    const meta = manifest.skills[skill.name];
    skill.favorite = meta?.favorite === true;
    skill.favoriteKind = meta?.kind ?? (skill.group === 'personal' ? 'personal' : 'community');
    skill.favoriteInstallable = true;
    skill.favoriteSource = meta?.source ?? null;
    skill.displayPath = skill.path === undefined ? undefined : shortPath(skill.path);
  }

  const byName = new Map();
  for (const skill of skills) {
    const list = byName.get(skill.name) ?? [];
    list.push(skill);
    byName.set(skill.name, list);
  }
  for (const list of byName.values()) {
    const byScope = new Map();
    for (const skill of list) {
      const scope = skill.scopeKey ?? 'global';
      const entries = byScope.get(scope) ?? [];
      entries.push(skill);
      byScope.set(scope, entries);
    }
    for (const entries of byScope.values()) {
      const sorted = [...entries].sort((left, right) => {
        const priority = groupInfo(left.group).priority - groupInfo(right.group).priority;
        if (priority !== 0) return priority;
        return String(left.path ?? '').localeCompare(String(right.path ?? ''));
      });
      for (const skill of entries) {
        skill.duplicateCount = entries.length;
        skill.sameNameElsewhere = list.length - entries.length;
        skill.shadowed = sorted[0] !== skill;
        skill.winner = sorted[0] === skill;
      }
    }
  }

  const groupOrder = new Map(GROUPS.map((group, index) => [group.key, index]));
  const byGroup = new Map();
  for (const skill of skills) {
    const list = byGroup.get(skill.group) ?? [];
    list.push(skill);
    byGroup.set(skill.group, list);
  }
  const groups = [...byGroup.entries()]
    .sort(([left], [right]) => (groupOrder.get(left) ?? 99) - (groupOrder.get(right) ?? 99))
    .map(([key, list]) => ({
      key,
      title: groupInfo(key).title,
      hint: groupInfo(key).hint,
      skills: list.sort(
        (left, right) =>
          Number(right.favorite) - Number(left.favorite) ||
          left.name.localeCompare(right.name) ||
          String(left.path ?? '').localeCompare(String(right.path ?? '')),
      ),
    }));

  return {
    cwd,
    projectRoots: roots,
    complete: completeRef.value,
    groups,
    skills,
    count: skills.length,
  };
}


function findEntry(collected, { name, path: filePath }) {
  if (typeof filePath === 'string' && filePath !== '') {
    const exact = collected.skills.find((entry) => entry.path === filePath);
    if (exact !== undefined && (typeof name !== 'string' || name === '' || exact.name === name)) return exact;
    throw new Error(`skill "${name ?? ''}" is no longer at that path; refresh the library`);
  }
  if (typeof name === 'string') {
    const matches = collected.skills.filter((entry) => entry.name === name);
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) throw new Error(`skill "${name}" has several entries; pass its exact path`);
  }
  throw new Error(`skill "${name ?? ''}" was not found`);
}

async function walkDirectory(directory, base = directory, output = [], budget = { files: 0 }) {
  if (budget.files > 2000) return output;
  let entries;
  try {
    entries = await fsp.readdir(directory, { withFileTypes: true });
  } catch {
    return output;
  }
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.DS_Store') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walkDirectory(absolute, base, output, budget);
    } else if (entry.isFile()) {
      budget.files += 1;
      try {
        const stat = await fsp.stat(absolute);
        output.push({ path: path.relative(base, absolute), bytes: stat.size });
      } catch {
        // A file that vanished during the walk is not part of the listing.
      }
    }
  }
  return output;
}

/** Read one skill's instruction body and its supporting files. */
export async function readSkill(config, collected, selector) {
  const entry = findEntry(collected, selector);
  if (entry.path === undefined) throw new Error(`skill "${entry.name}" has no instruction file to read`);
  const content = readBounded(entry.path, config.maxContentBytes);
  const directory = path.dirname(entry.path);
  const files = entry.flat
    ? [{ path: path.basename(entry.path), bytes: Buffer.byteLength(content) }]
    : await walkDirectory(directory);
  return {
    name: entry.name,
    path: entry.path,
    group: entry.group,
    source: entry.source,
    provider: entry.provider,
    content,
    digest: digest(content),
    files,
    editable: entry.editable,
    deletable: entry.deletable,
    linked: entry.linked,
    modelInvocable: entry.modelInvocable,
    userInvocable: entry.userInvocable,
  };
}

/** Toggle model or user invocation in one skill's frontmatter. */
export async function setInvocation(config, collected, request) {
  const entry = findEntry(collected, request);
  assertEditable(entry);
  if (request.modelInvocable === undefined && request.userInvocable === undefined) {
    throw new Error('pass modelInvocable or userInvocable');
  }
  const content = readBounded(entry.path, config.maxContentBytes);
  const parsed = parseFrontmatter(content);
  const currentModel = parsed.disableModelInvocation !== true;
  const currentUser = parsed.userInvocable !== false;
  const nextModel = request.modelInvocable ?? currentModel;
  const nextUser = request.userInvocable ?? currentUser;
  if (nextModel === currentModel && nextUser === currentUser) {
    return { path: entry.path, modelInvocable: currentModel, userInvocable: currentUser, changed: false };
  }
  const next = setFrontmatterFields(content, {
    ...(request.modelInvocable === undefined ? {} : { modelInvocable: nextModel }),
    ...(request.userInvocable === undefined ? {} : { userInvocable: nextUser }),
  });
  const reparsed = parseFrontmatter(next);
  if (reparsed.name !== undefined && reparsed.name !== entry.name) {
    throw new Error('refusing to change a skill name while toggling invocation');
  }
  const backup = backupSkillFile(config, entry, content);
  writeAtomic(entry.path, next, 0o644);
  return {
    path: entry.path,
    modelInvocable: reparsed.disableModelInvocation !== true,
    userInvocable: reparsed.userInvocable !== false,
    changed: true,
    backup,
  };
}

/** Replace a skill's instruction file after validating its identity. */
export async function saveSkillContent(config, collected, request) {
  const entry = findEntry(collected, request);
  assertEditable(entry);
  if (typeof request.content !== 'string') throw new Error('content must be a string');
  const content = request.content;
  if (Buffer.byteLength(content, 'utf8') > config.maxContentBytes) {
    throw new Error(`content exceeds the ${config.maxContentBytes}-byte limit`);
  }
  const current = readBounded(entry.path, config.maxContentBytes);
  const currentDigest = digest(current);
  if (typeof request.expectedDigest === 'string' && request.expectedDigest !== currentDigest) {
    throw Object.assign(new Error('the file changed after it was loaded; refresh before saving'), {
      status: 409,
    });
  }
  const parsed = parseFrontmatter(content);
  if (parsed.name === undefined || parsed.name === '') throw new Error('the edited file needs a name field');
  if (parsed.name !== entry.name) throw new Error(`the edited name must stay "${entry.name}"`);
  if (parsed.description === undefined || parsed.description.trim() === '') {
    throw new Error('the edited file needs a non-empty description field');
  }
  if (digest(content) === currentDigest) {
    return { path: entry.path, digest: currentDigest, changed: false };
  }
  const backup = backupSkillFile(config, entry, current);
  writeAtomic(entry.path, content, 0o644);
  return { path: entry.path, digest: digest(content), changed: true, backup };
}

/** Create a new skill under the personal or project root. */
export async function createSkill(config, request) {
  if (!isValidSkillName(request.name)) {
    throw Object.assign(new Error('name must be kebab-case (lowercase letters, digits, single hyphens)'), {
      status: 400,
    });
  }
  if (typeof request.description !== 'string' || request.description.trim() === '') {
    throw Object.assign(new Error('description is required'), { status: 400 });
  }
  if (typeof request.content !== 'string' || request.content.trim() === '') {
    throw Object.assign(new Error('content is required'), { status: 400 });
  }
  if (Buffer.byteLength(request.content, 'utf8') > config.maxContentBytes) {
    throw Object.assign(new Error('content exceeds the size limit'), { status: 400 });
  }
  let root;
  if (request.root === 'personal') root = libraryBase(config);
  else if (request.root === 'project') {
    if (typeof request.cwd !== 'string' || request.cwd.trim() === '') {
      throw Object.assign(new Error('cwd is required for a project skill'), { status: 400 });
    }
    root = path.join(findProjectRoot(request.cwd), '.dsh', 'skills');
  } else {
    throw Object.assign(new Error('root must be "personal" or "project"'), { status: 400 });
  }
  const directory = path.join(root, request.name);
  const file = path.join(directory, 'SKILL.md');
  const flat = path.join(root, `${request.name}.md`);
  if (fs.existsSync(directory) || fs.existsSync(flat) || fs.existsSync(file)) {
    throw Object.assign(new Error(`skill "${request.name}" already exists in that root`), { status: 409 });
  }
  fs.mkdirSync(directory, { recursive: true });
  const content = buildSkillFile({
    name: request.name,
    description: request.description,
    whenToUse: typeof request.whenToUse === 'string' ? request.whenToUse : undefined,
    content: request.content,
    disableModelInvocation: request.disableModelInvocation === true,
    userInvocable: request.userInvocable === false ? false : undefined,
  });
  try {
    fs.writeFileSync(file, content, { encoding: 'utf8', flag: 'wx', mode: 0o644 });
  } catch (error) {
    fs.rmSync(directory, { recursive: true, force: true });
    throw error;
  }
  if (request.root === 'personal') {
    setSkillMeta(config, request.name, {
      kind: 'personal',
      favorite: false,
      source: { kind: 'personal' },
      collectedFrom: null,
      addedAt: new Date().toISOString(),
    });
  }
  return { path: file, root, name: request.name };
}

const SKIP_COPY = new Set(['.git', 'node_modules', '.DS_Store', '.trash']);

async function copyBundle(sourceDirectory, targetDirectory, config, budget) {
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
      await copyBundle(source, target, config, budget);
      continue;
    }
    if (!entry.isFile()) {
      budget.skipped += 1;
      continue;
    }
    const stat = await fsp.stat(source);
    budget.files += 1;
    budget.bytes += stat.size;
    if (budget.files > config.maxBundleFiles) throw new Error('skill bundle has too many files');
    if (budget.bytes > config.maxBundleBytes) throw new Error('skill bundle exceeds the byte limit');
    await fsp.copyFile(source, target);
    await fsp.chmod(target, stat.mode & 0o777);
  }
}

/** Copy a skill bundle into the personal root, refusing to overwrite. */
export async function saveAsPersonal(config, collected, request) {
  const entry = findEntry(collected, request);
  assertNotLinked(entry);
  if (!entry.path) throw new Error(`skill "${entry.name}" has no instruction file`);
  const root = libraryBase(config);
  const target = path.join(root, entry.name);
  if (fs.existsSync(target) || fs.existsSync(path.join(root, `${entry.name}.md`))) {
    throw Object.assign(new Error(`a personal skill named "${entry.name}" already exists; edit it instead`), {
      status: 409,
    });
  }
  fs.mkdirSync(root, { recursive: true });
  const budget = { files: 0, bytes: 0, skipped: 0 };
  try {
    if (entry.flat) {
      await fsp.mkdir(target, { recursive: true, mode: 0o755 });
      const stat = await fsp.stat(entry.path);
      await fsp.copyFile(entry.path, path.join(target, 'SKILL.md'));
      await fsp.chmod(path.join(target, 'SKILL.md'), stat.mode & 0o777);
      budget.files = 1;
      budget.bytes = stat.size;
    } else {
      await fsp.mkdir(target, { recursive: true, mode: 0o755 });
      await copyBundle(path.dirname(entry.path), target, config, budget);
    }
    const copiedInstruction = path.join(target, 'SKILL.md');
    if (!fs.existsSync(copiedInstruction)) {
      throw new Error(`could not copy the instruction file for "${entry.name}" (it may be a symbolic link)`);
    }
    return {
      path: copiedInstruction,
      target,
      files: budget.files,
      bytes: budget.bytes,
      skipped: budget.skipped,
    };
  } catch (error) {
    fs.rmSync(target, { recursive: true, force: true });
    throw error;
  }
}

/** Move a skill into the plugin trash. Deletion always requires confirmation. */
export async function deleteSkill(config, collected, request) {
  const entry = findEntry(collected, request);
  if (request.confirm !== true) throw new Error('set confirm to true after the user agrees to delete');
  if (!entry.deletable) throw new Error(`skill "${entry.name}" is read-only`);
  assertNotLinked(entry);
  if (entry.root === undefined) throw new Error(`skill "${entry.name}" has no verifiable root`);
  assertInside(entry.root, entry.path);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(config.trashDir, `${stamp}-${entry.name}-${randomBytes(3).toString('hex')}`);
  fs.mkdirSync(config.trashDir, { recursive: true });
  if (entry.flat) {
    fs.mkdirSync(target, { recursive: true });
    fs.renameSync(entry.path, path.join(target, 'SKILL.md'));
  } else {
    fs.renameSync(path.dirname(entry.path), target);
  }
  return { name: entry.name, movedTo: target };
}

/** Set or clear the library metadata for one skill. */
export function setFavorite(config, collected, request) {
  if (typeof request.value !== 'boolean') throw new Error('value must be a boolean');
  if (request.value === false) {
    const name = typeof request.name === 'string' ? request.name : undefined;
    if (name === undefined) throw new Error('name is required to remove a favorite');
    const manifest = readLibraryManifest(config);
    const meta = manifest.skills[name];
    if (meta !== undefined) {
      manifest.skills[name] = { ...meta, favorite: false };
      writeLibraryManifest(config, manifest);
    }
    return { key: name, favorite: false };
  }
  const entry = findEntry(collected, request);
  const manifest = readLibraryManifest(config);
  const current = manifest.skills[entry.name] ?? {
    kind: entry.group === 'personal' ? 'personal' : 'collected',
    source: null,
    addedAt: new Date().toISOString(),
  };
  manifest.skills[entry.name] = { ...current, favorite: true };
  writeLibraryManifest(config, manifest);
  return {
    key: entry.name,
    favorite: true,
    kind: current.kind,
    source: current.source,
    installable: true,
  };
}

export { shortPath };
