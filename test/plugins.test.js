import { execFileSync } from 'node:child_process';
import { resolveConfig } from '../lib/core.js';
import { gitSync } from '../lib/sync.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scanPlugins, setPluginFavorite, readPluginFavorites } from '../lib/plugins.js';

function json(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data)); }

test('plugin inventory separates clients, scopes and cached versions without claiming activation', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-inventory-'));
  try {
    const bundle = path.join(home, '.claude/plugins/cache/market/shared/1');
    json(path.join(bundle, '.claude-plugin/plugin.json'), { name: 'shared', version: '1' });
    json(path.join(home, '.claude/plugins/installed_plugins.json'), { version: 2, plugins: {
      'shared@market': [{ installPath: bundle, version: '1', scope: 'user' }, { installPath: bundle, version: '1', scope: 'project', projectPath: '/project' }],
      'gone@market': [{ installPath: path.join(home, 'missing'), version: '2' }],
    } });
    json(path.join(home, '.cursor/plugins/cache/market/shared/2/.cursor-plugin/plugin.json'), { name: 'shared', version: '2' });
    json(path.join(home, '.cursor/plugins/local/local-plugin/plugin.json'), { name: 'local-plugin', version: '3' });
    json(path.join(home, '.cursor/plugins/marketplaces/vendor/unused/.cursor-plugin/plugin.json'), { name: 'not-installed' });
    json(path.join(home, '.codex/plugins/cache/market/shared/4/.codex-plugin/plugin.json'), { name: 'shared', version: '4' });
    const dshHome = path.join(home, '.dsh');
    json(path.join(dshHome, 'profiles/desktop/package.json'), { dependencies: { example: '1', library: '2' } });
    json(path.join(dshHome, 'profiles/desktop/node_modules/example/package.json'), { name: 'example', version: '1', dsh: { client: {} } });
    json(path.join(dshHome, 'profiles/desktop/node_modules/library/package.json'), { name: 'library', version: '2' });
    const result = scanPlugins({ dshHome }, { home });
    assert.equal(result.plugins.length, 7);
    assert.equal(new Set(result.plugins.map(p => p.id)).size, 7);
    assert.equal(result.plugins.filter(p => p.client === 'claude' && p.name === 'shared').length, 2);
    assert.equal(result.plugins.find(p => p.name === 'gone').files, 'missing');
    assert.equal(result.plugins.find(p => p.client === 'cursor' && p.name === 'shared').installation, 'cache-only');
    assert.equal(result.plugins.find(p => p.name === 'local-plugin').installation, 'local-directory');
    assert.equal(result.plugins.find(p => p.client === 'dsh').scope, 'desktop');
    assert.ok(result.plugins.every(p => p.enabled === 'unknown' && p.loaded === 'unknown'));
    assert.equal(result.warnings.length, 0);
    assert.equal(scanPlugins({ dshHome }, { home }).plugins.length, 7);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test('corrupt installation record is reported and cannot promote cache evidence', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-inventory-'));
  try {
    const file = path.join(home, '.cursor/plugins/installed_plugins.json');
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, '{');
    const result = scanPlugins({ dshHome: path.join(home, '.dsh') }, { home });
    assert.equal(result.plugins.length, 0);
    assert.deepEqual(result.warnings, [{ path: file, reason: 'unreadable-record' }]);
    assert.equal(fs.readFileSync(file, 'utf8'), '{');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});


test('plugin favorites retain version and client across restore without copying plugin files', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-favorites-'));
  try {
    const config = { dshHome: path.join(home, '.dsh'), personalDir: path.join(home, 'repo') };
    for (const [client, version] of [['cursor', '1'], ['cursor', '2'], ['codex', '1']]) {
      json(path.join(home, '.' + client, 'plugins/cache/market/shared', version, '.cursor-plugin/plugin.json'), { name: 'shared', version });
    }
    const first = scanPlugins(config, { home }).plugins.find(p => p.client === 'cursor' && p.version === '1');
    setPluginFavorite(config, first.favoriteKey, true, { home });
    setPluginFavorite(config, first.favoriteKey, true, { home });
    assert.equal(readPluginFavorites(config).entries.length, 1);
    const observed = scanPlugins(config, { home });
    assert.equal(observed.plugins.filter(p => p.favorite).length, 1);
    assert.equal(observed.plugins.find(p => p.favorite).version, '1');
    const file = path.join(config.personalDir, '.skill-hub/plugins.json');
    assert.ok(!fs.readFileSync(file, 'utf8').includes(home));
    assert.equal(fs.existsSync(path.join(config.personalDir, 'skills')), false);
    const otherHome = path.join(home, 'other-machine');
    const restored = scanPlugins(config, { home: otherHome });
    assert.equal(restored.plugins.length, 1);
    assert.equal(restored.plugins[0].installation, 'not-observed');
    assert.equal(restored.plugins[0].favorite, true);
    setPluginFavorite(config, first.favoriteKey, false, { home: otherHome });
    assert.equal(scanPlugins(config, { home: otherHome }).plugins.length, 0);
    assert.throws(() => setPluginFavorite(config, 'a'.repeat(64), true, { home }), /expired/);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test('corrupt plugin favorites are preserved instead of overwritten', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-favorites-'));
  try {
    const config = { dshHome: path.join(home, '.dsh'), personalDir: path.join(home, 'repo') };
    const file = path.join(config.personalDir, '.skill-hub/plugins.json');
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, '{');
    assert.throws(() => setPluginFavorite(config, 'a'.repeat(64), false, { home }), /preserved/);
    assert.equal(fs.readFileSync(file, 'utf8'), '{');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});


test('personal Git sync commits plugin favorites metadata', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-favorites-git-'));
  try {
    const config = resolveConfig({ dshHome: path.join(home, '.dsh'), agentsHome: path.join(home, '.agents'), personalDir: path.join(home, 'repo') });
    json(path.join(home, '.cursor/plugins/local/example/plugin.json'), { name: 'example', version: '1.0' });
    const row = scanPlugins(config, { home }).plugins[0];
    setPluginFavorite(config, row.favoriteKey, true, { home });
    await gitSync(config);
    const content = execFileSync('/usr/bin/git', ['show', 'HEAD:.skill-hub/plugins.json'], { cwd: config.personalDir, encoding: 'utf8' });
    assert.equal(JSON.parse(content).entries[0].pluginId, 'example');
    assert.equal(JSON.parse(content).entries[0].client, 'cursor');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
