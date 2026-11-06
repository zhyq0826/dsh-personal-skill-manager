import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

import {
  collectSkills,
  effectiveConfig,
  manifestPath,
  readCatalog,
  readLibraryManifest,
  resolveConfig,
  resolveSource,
  setFavorite,
  writeSettings,
} from '../lib/core.js';
import { gitSync, restorePersonal, syncStatus } from '../lib/sync.js';
import { collectTarget, distribute, migrateToLibrary } from '../lib/targets.js';

function git(cwd, args) {
  return execFileSync(
    '/usr/bin/git',
    ['-c', 'user.name=Skill Hub Test', '-c', 'user.email=test@skill-hub.invalid', ...args],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

function writeSkill(root, name, description = `${name} description`) {
  const directory = path.join(root, name);
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'SKILL.md');
  fs.writeFileSync(
    file,
    `---\nname: ${name}\ndescription: '${description}'\n---\n\n# ${name}\n\nBody.\n`,
  );
  return file;
}

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-hub-sync-test-'));
  const dshHome = path.join(root, 'dsh');
  const agentsHome = path.join(root, 'agents');
  const project = path.join(root, 'project');
  fs.mkdirSync(project, { recursive: true });
  const config = resolveConfig({ dshHome, agentsHome });
  config.targets = [
    { id: 'codex', label: 'Codex', path: path.join(root, 'targets', 'codex'), mode: 'link', enabled: true },
    { id: 'claude', label: 'Claude Code', path: path.join(root, 'targets', 'claude'), mode: 'copy', enabled: true },
    { id: 'dsh', label: 'DSH', path: config.personalDir, mode: 'link', enabled: true },
  ];
  writeSettings(config, { targets: config.targets });
  return { root, dshHome, agentsHome, project, config };
}

function writeV2Favorites(config, favorites) {
  fs.mkdirSync(path.dirname(manifestPath(config)), { recursive: true });
  fs.writeFileSync(manifestPath(config), JSON.stringify({ version: 2, favorites }, null, 2));
}

test('resolveSource records a clean Git origin and full commit', async () => {
  const { root, config } = setup();
  try {
    const repo = path.join(root, 'source-repo');
    writeSkill(path.join(repo, 'skills'), 'alpha');
    git(repo, ['init', '-b', 'main']);
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-m', 'initial']);
    git(repo, ['remote', 'add', 'origin', repo]);
    const collected = await collectSkills(config, {
      cwd: root,
      projectRoots: [root],
      libraryOnly: true,
    });
    const source = resolveSource(config, {
      name: 'alpha',
      path: path.join(repo, 'skills', 'alpha', 'SKILL.md'),
      group: 'community',
      flat: false,
    });
    assert.equal(source.kind, 'git');
    assert.equal(source.repository, repo);
    assert.match(source.revision, /^[a-f0-9]{40}$/);
    assert.equal(source.subpath, 'skills/alpha');
    assert.equal(collected.skills.length, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('setFavorite writes v3 library metadata', async () => {
  const { root, config } = setup();
  try {
    writeSkill(config.personalDir, 'alpha');
    const collected = await collectSkills(config, { libraryOnly: true, cwd: root });
    const result = setFavorite(config, collected, { name: 'alpha', value: true });
    assert.equal(result.favorite, true);
    const manifest = readLibraryManifest(config);
    assert.equal(manifest.version, 3);
    assert.equal(manifest.skills.alpha.favorite, true);
    assert.equal(manifest.skills.alpha.kind, 'personal');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('migration turns v2 favorites into catalog entries without copying content', async () => {
  const { root, config } = setup();
  try {
    writeSkill(path.join(root, 'targets', 'codex'), 'alpha', 'target alpha');
    writeV2Favorites(config, [
      {
        name: 'alpha',
        kind: 'community',
        source: { kind: 'unknown', reason: 'test source' },
        addedAt: new Date().toISOString(),
      },
    ]);
    const result = await migrateToLibrary(config);
    assert.equal(result.collected, 0);
    assert.equal(result.results.find((entry) => entry.name === 'alpha').state, 'catalog');
    assert.equal(fs.existsSync(path.join(config.personalDir, 'alpha', 'SKILL.md')), false);
    const catalog = readCatalog(config);
    assert.equal(catalog.entries.length, 1);
    assert.equal(catalog.entries[0].name, 'alpha');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('collectTarget copies a client skill into skills/ as a written skill', async () => {
  const { root, config } = setup();
  try {
    writeSkill(path.join(root, 'targets', 'codex'), 'beta', 'client beta');
    const result = await collectTarget(config, { name: 'beta', targetId: 'codex' });
    assert.equal(result.targetId, 'codex');
    assert.ok(fs.existsSync(path.join(config.personalDir, 'beta', 'SKILL.md')));
    const manifest = readLibraryManifest(config);
    assert.equal(manifest.skills.beta.kind, 'personal');
    assert.equal(readCatalog(config).entries.some((entry) => entry.name === 'beta'), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('distribution links into link targets and copies into copy targets', async () => {
  const { root, config } = setup();
  try {
    writeSkill(config.personalDir, 'alpha');
    writeSkill(config.personalDir, 'beta');
    const result = await distribute(config, { replaceConflicts: false });
    assert.equal(result.failed, 0);
    const codexAlpha = path.join(root, 'targets', 'codex', 'alpha');
    const claudeAlpha = path.join(root, 'targets', 'claude', 'alpha');
    assert.equal(fs.lstatSync(codexAlpha).isSymbolicLink(), true);
    assert.equal(fs.lstatSync(claudeAlpha).isDirectory(), true);
    assert.ok(fs.existsSync(path.join(claudeAlpha, 'SKILL.md')));
    assert.equal(result.source, 2);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('distribution reports conflicts and can back up and replace them', async () => {
  const { root, config } = setup();
  try {
    writeSkill(config.personalDir, 'alpha', 'library alpha');
    writeSkill(path.join(root, 'targets', 'codex'), 'alpha', 'local alpha');
    const conflict = await distribute(config, { replaceConflicts: false });
    assert.ok(conflict.conflicts >= 1);
    const codexAlpha = path.join(root, 'targets', 'codex', 'alpha');
    assert.equal(fs.lstatSync(codexAlpha).isSymbolicLink(), false);
    const replaced = await distribute(config, { replaceConflicts: true });
    assert.ok(replaced.linked >= 1);
    assert.equal(fs.lstatSync(codexAlpha).isSymbolicLink(), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('gitSync commits a personal library without a remote', async () => {
  const { root, config } = setup();
  try {
    writeSkill(config.personalDir, 'personal-alpha');
    const result = await gitSync(config);
    assert.equal(result.changed, true);
    assert.equal(result.pushed, false);
    assert.ok(result.commit);
    assert.ok(fs.existsSync(path.join(config.personalDir, '.git')));
    assert.ok(fs.existsSync(manifestPath(config)));
    const status = syncStatus(config);
    assert.equal(status.repo.isRepo, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('gitSync pushes to an empty remote and restore clones and distributes', async () => {
  const { root, config } = setup();
  try {
    const bare = path.join(root, 'remote.git');
    git(root, ['init', '--bare', bare]);
    writeSettings(config, { gitRemote: bare, gitBranch: 'main' });
    const effective = effectiveConfig(config);
    effective.targets = config.targets;
    fs.mkdirSync(effective.personalDir, { recursive: true });
    writeSkill(effective.personalDir, 'personal-alpha');
    const result = await gitSync(effective);
    assert.equal(result.pushed, true);
    assert.equal(result.created, true);

    const target = resolveConfig({
      dshHome: path.join(root, 'dsh-b'),
      agentsHome: path.join(root, 'agents-b'),
    });
    target.targets = [
      { id: 'codex', label: 'Codex', path: path.join(root, 'targets', 'codex-b'), mode: 'link', enabled: true },
      { id: 'dsh', label: 'DSH', path: target.personalDir, mode: 'link', enabled: true },
    ];
    writeSettings(target, { gitRemote: bare, gitBranch: 'main' });
    const restored = await restorePersonal({ ...effectiveConfig(target), targets: target.targets });
    assert.equal(restored.repo.isRepo, true);
    assert.ok(fs.existsSync(path.join(target.personalDir, 'personal-alpha', 'SKILL.md')));
    assert.ok(fs.lstatSync(path.join(root, 'targets', 'codex-b', 'personal-alpha')).isSymbolicLink());
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('restore initializes and pushes an existing local library only into an empty remote', async () => {
  const { root, config } = setup();
  try {
    const bare = path.join(root, 'empty-remote.git');
    git(root, ['init', '--bare', bare]);
    writeSettings(config, { gitRemote: bare, gitBranch: 'main' });
    const effective = effectiveConfig(config);
    effective.targets = config.targets;
    fs.mkdirSync(effective.personalDir, { recursive: true });
    writeSkill(effective.personalDir, 'personal-alpha');
    const restored = await restorePersonal(effective);
    assert.equal(restored.initialized, true);
    assert.equal(restored.sync.pushed, true);
    assert.ok(fs.existsSync(path.join(effective.personalDir, '.git')));

    const local = resolveConfig({
      dshHome: path.join(root, 'dsh-b'),
      agentsHome: path.join(root, 'agents-b'),
    });
    local.targets = config.targets;
    writeSettings(local, { gitRemote: bare, gitBranch: 'main' });
    const localEffective = effectiveConfig(local);
    localEffective.targets = local.targets;
    fs.mkdirSync(localEffective.personalDir, { recursive: true });
    writeSkill(localEffective.personalDir, 'local-only');
    await assert.rejects(restorePersonal(localEffective), /already has a library branch/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a nested skills/ directory is the library base when present', async () => {
  const { root, config } = setup();
  try {
    fs.mkdirSync(path.join(config.personalDir, 'skills'), { recursive: true });
    writeSkill(path.join(config.personalDir, 'skills'), 'nested-alpha');
    const collected = await collectSkills(config, { libraryOnly: true, cwd: root });
    assert.ok(collected.skills.some((skill) => skill.name === 'nested-alpha'));
    const created = await import('../lib/core.js').then((core) =>
      core.createSkill(config, {
        root: 'personal',
        name: 'nested-beta',
        description: 'Nested beta',
        content: '# Nested beta',
      }),
    );
    assert.ok(fs.existsSync(path.join(config.personalDir, 'skills', 'nested-beta', 'SKILL.md')));
    assert.equal(created.path.startsWith(path.join(config.personalDir, 'skills')), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the merged list shows library and client rows with client provenance', async () => {
  const { root, config } = setup();
  try {
    writeSkill(config.personalDir, 'alpha', 'library alpha');
    writeSkill(path.join(root, 'targets', 'codex'), 'alpha', 'codex alpha');
    writeSkill(path.join(root, 'targets', 'codex'), 'beta', 'codex beta');
    const all = await import('../lib/targets.js').then((targets) => targets.collectAllSkills(config));
    const alpha = all.skills.find((skill) => skill.name === 'alpha');
    const beta = all.skills.find((skill) => skill.name === 'beta');
    assert.equal(alpha.inLibrary, true);
    assert.ok(alpha.clientIds.includes('codex'));
    assert.equal(beta.inLibrary, false);
    assert.equal(beta.kind, 'client');
    assert.ok(beta.clientIds.includes('codex'));
    assert.equal(all.count, 2);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('saveAsMine promotes a collected skill and can collect a client skill as written', async () => {
  const { root, config } = setup();
  try {
    writeSkill(config.personalDir, 'alpha');
    const collected = await collectSkills(config, { libraryOnly: true, cwd: root });
    const favorite = setFavorite(config, collected, { name: 'alpha', value: true });
    assert.equal(favorite.favorite, true);
    const { saveAsMine } = await import('../lib/targets.js');
    const promoted = await saveAsMine(config, { name: 'alpha' });
    assert.equal(promoted.promoted, true);
    assert.equal(readLibraryManifest(config).skills.alpha.kind, 'personal');

    writeSkill(path.join(root, 'targets', 'codex'), 'beta', 'client beta');
    const copied = await saveAsMine(config, { name: 'beta', clientId: 'codex' });
    assert.equal(copied.collected, true);
    assert.equal(readLibraryManifest(config).skills.beta.kind, 'personal');
    assert.ok(fs.existsSync(path.join(config.personalDir, 'beta', 'SKILL.md')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('distributeSkill updates only the selected target', async () => {
  const { root, config } = setup();
  try {
    writeSkill(config.personalDir, 'alpha');
    const { distributeSkill } = await import('../lib/targets.js');
    const result = await distributeSkill(config, { name: 'alpha', targetIds: ['codex'] });
    assert.equal(result.linked, 1);
    assert.ok(fs.lstatSync(path.join(root, 'targets', 'codex', 'alpha')).isSymbolicLink());
    assert.equal(fs.existsSync(path.join(root, 'targets', 'claude', 'alpha')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('catalog favorites install into clients without copying into the library', async () => {
  const { root, config } = setup();
  try {
    const repo = path.join(root, 'community-repo');
    writeSkill(path.join(repo, 'skills'), 'community-alpha');
    git(repo, ['init', '-b', 'main']);
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-m', 'initial']);
    const revision = git(repo, ['rev-parse', 'HEAD']).trim();
    const { addCatalogEntry } = await import('../lib/core.js');
    addCatalogEntry(config, {
      name: 'community-alpha',
      source: {
        kind: 'git',
        repository: repo,
        revision,
        subpath: 'skills/community-alpha',
        flat: false,
        origin: 'test',
      },
      collectedFrom: { id: 'codex', label: 'Codex' },
    });
    const { installCatalog } = await import('../lib/catalog.js');
    const result = await installCatalog(config, { targetIds: ['codex'] });
    assert.equal(result.installed, 1);
    assert.ok(fs.existsSync(path.join(root, 'targets', 'codex', 'community-alpha', 'SKILL.md')));
    assert.equal(fs.existsSync(path.join(config.personalDir, 'community-alpha')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
