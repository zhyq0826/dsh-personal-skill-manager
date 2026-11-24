import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import test from 'node:test';

import { createRoutes } from '../lib/routes.js';
import { resolveConfig, writeSettings } from '../lib/core.js';

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-hub-routes-test-'));
  const dshHome = path.join(root, 'dsh');
  const project = path.join(root, 'project');
  fs.mkdirSync(path.join(project, '.git'), { recursive: true });
  const config = resolveConfig({ dshHome, agentsHome: path.join(root, 'agents') });
  config.targets = [
    { id: 'codex', label: 'Codex', path: path.join(root, 'target-codex'), mode: 'link', enabled: true },
    { id: 'claude', label: 'Claude', path: path.join(root, 'target-claude'), mode: 'link', enabled: true },
  ];
  writeSettings(config, { targets: config.targets });
  const ctx = {
    sessions: { list: () => [{ header: { cwd: project } }] },
    get: () => undefined,
  };
  return { root, project, config, routes: createRoutes(ctx, config) };
}

function invoke(routes, routePath, { method = 'GET', body, headers = {}, remoteAddress = '127.0.0.1' } = {}) {
  return new Promise((resolve, reject) => {
    const request = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]);
    Object.assign(request, {
      method,
      url: routePath,
      headers: {
        host: '127.0.0.1:53253',
        'sec-fetch-site': 'same-origin',
        ...headers,
      },
      socket: { remoteAddress },
    });
    let status;
    const response = {
      writeHead(code) {
        status = code;
      },
      end(text) {
        resolve({ status, body: text === undefined ? undefined : JSON.parse(text) });
      },
    };
    const route = routes.find((entry) => entry.path === routePath.split('?')[0]);
    Promise.resolve(route.handler(request, response)).catch(reject);
  });
}

test('routes reject non-loopback sockets and cross-origin requests', async () => {
  const { root, config, routes } = setup();
  try {
    const remote = await invoke(routes, '/api/skill-hub/list', { remoteAddress: '192.168.1.5' });
    assert.equal(remote.status, 403);
    const cross = await invoke(routes, '/api/skill-hub/list', {
      headers: { origin: 'http://evil.example' },
    });
    assert.equal(cross.status, 403);
    assert.equal(config.maxContentBytes > 0, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('writes require the panel header and create a scannable skill', async () => {
  const { root, project, routes } = setup();
  try {
    const noHeader = await invoke(routes, '/api/skill-hub/create', {
      method: 'POST',
      body: { root: 'personal', cwd: project, name: 'alpha', description: 'Alpha', content: '# Alpha' },
    });
    assert.equal(noHeader.status, 403);

    const created = await invoke(routes, '/api/skill-hub/create', {
      method: 'POST',
      headers: { 'x-skill-hub': '1' },
      body: { root: 'personal', cwd: project, name: 'alpha', description: 'Alpha', content: '# Alpha' },
    });
    assert.equal(created.status, 200);
    assert.match(created.body.path, /alpha\/SKILL\.md$/);
    assert.ok(fs.existsSync(created.body.path));

    const listed = await invoke(routes, '/api/skill-hub/list?cwd=' + encodeURIComponent(project));
    assert.equal(listed.status, 200);
    assert.ok(listed.body.skills.some((skill) => skill.name === 'alpha' && skill.inLibrary === true));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('sync status and settings routes expose the portable library controls', async () => {
  const { root, config, routes } = setup();
  try {
    const status = await invoke(routes, '/api/skill-hub/sync/status');
    assert.equal(status.status, 200);
    assert.equal(status.body.ok, true);
    assert.equal(status.body.status.manifest.count, 0);

    const personalDir = path.join(root, 'personal');
    const saved = await invoke(routes, '/api/skill-hub/settings', {
      method: 'POST',
      headers: { 'x-skill-hub': '1' },
      body: { personalDir, gitRemote: '', gitBranch: 'main', autoInstall: false, autoSync: false },
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.status.personalDir, personalDir);
    assert.equal(saved.body.warning, undefined);
    assert.ok(fs.existsSync(path.join(dshHomeOf(config), 'skill-hub', 'settings.json')));

    const reopened = await invoke(routes, '/api/skill-hub/sync/status');
    assert.equal(reopened.body.status.personalDir, personalDir);
    assert.equal(reopened.body.warning, undefined);

    const synced = await invoke(routes, '/api/skill-hub/sync', {
      method: 'POST',
      headers: { 'x-skill-hub': '1' },
      body: {},
    });
    assert.equal(synced.status, 200);
    assert.ok(fs.existsSync(path.join(personalDir, '.git')));

    const installed = await invoke(routes, '/api/skill-hub/install-favorites', {
      method: 'POST',
      headers: { 'x-skill-hub': '1' },
      body: {},
    });
    assert.equal(installed.status, 200);
    assert.equal(installed.body.result.failed, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function dshHomeOf(config) {
  return path.dirname(path.dirname(config.settingsPath));
}

test('favoriting a client-only skill records a catalog source without copying content', async () => {
  const { root, config, routes } = setup();
  try {
    const targetSkill = path.join(root, 'target-codex', 'client-only', 'SKILL.md');
    fs.mkdirSync(path.dirname(targetSkill), { recursive: true });
    fs.writeFileSync(
      targetSkill,
      "---\nname: client-only\ndescription: 'Client only'\n---\n\n# Client only\n",
    );
    const before = await invoke(routes, '/api/skill-hub/list');
    const clientRow = before.body.skills.find((skill) => skill.name === 'client-only');
    assert.equal(clientRow.inLibrary, false);
    assert.equal(clientRow.inCatalog, false);

    const favorite = await invoke(routes, '/api/skill-hub/favorite', {
      method: 'POST',
      headers: { 'x-skill-hub': '1' },
      body: { name: 'client-only', clientId: 'codex', value: true },
    });
    assert.equal(favorite.status, 200);
    assert.equal(favorite.body.favorite, true);
    assert.equal(favorite.body.catalog, true);
    assert.equal(fs.existsSync(path.join(config.personalDir, 'client-only', 'SKILL.md')), false);
    assert.ok(fs.existsSync(path.join(config.personalDir, '.skill-hub', 'catalog.json')));

    const after = await invoke(routes, '/api/skill-hub/list');
    const row = after.body.skills.find((skill) => skill.name === 'client-only');
    assert.equal(row.inLibrary, false);
    assert.equal(row.inCatalog, true);

    const mine = await invoke(routes, '/api/skill-hub/save-as-mine', {
      method: 'POST',
      headers: { 'x-skill-hub': '1' },
      body: { name: 'client-only', clientId: 'codex' },
    });
    assert.equal(mine.status, 200);
    assert.equal(mine.body.kind, 'personal');
    assert.ok(fs.existsSync(path.join(config.personalDir, 'client-only', 'SKILL.md')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});


test('plugin favorites route requires write header and persists metadata', async () => {
  const { root, config, routes } = setup();
  try {
    const body = { key: 'a'.repeat(64), favorite: false };
    const denied = await invoke(routes, '/api/skill-hub/plugins/favorite', { method: 'POST', body });
    assert.equal(denied.status, 403);
    const saved = await invoke(routes, '/api/skill-hub/plugins/favorite', { method: 'POST', headers: { 'x-skill-hub': '1' }, body });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.favorite, false);
    assert.ok(fs.existsSync(path.join(config.personalDir, '.skill-hub/plugins.json')));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});


test('plugin distribution and model dispatch routes require the same write guard', async () => {
  const { root, routes } = setup();
  try {
    for (const suffix of ['preview','apply','adapt','adapt/start']) {
      const response = await invoke(routes, '/api/skill-hub/plugins/' + suffix, { method: 'POST', body: {} });
      assert.equal(response.status, 403);
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
