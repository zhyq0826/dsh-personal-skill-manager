import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PluginDelivery } from '../lib/plugin-delivery.js';
import { scanPlugins } from '../lib/plugins.js';
function json(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value)); }
function fixture() {
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-delivery-')));
  const source = path.join(home, '.cursor/plugins/local/example');
  json(path.join(source, '.cursor-plugin/plugin.json'), { name: 'example', version: '1' });
  fs.writeFileSync(path.join(source, 'README.md'), '# Example');
  const config = { dshHome: path.join(home, '.dsh'), personalDir: path.join(home, 'repo'), stateDir: path.join(home, 'state'), targets: ['cursor','claude','codex','dsh'].map(id => ({ id, enabled: true, path: path.join(home, 'targets', id, 'skills') })) };
  const service = new PluginDelivery(config, { home });
  const plugin = scanPlugins(config, { home }).plugins[0];
  return { home, source, config, service, plugin, close: () => fs.rmSync(home, { recursive: true, force: true }) };
}

test('native distribution previews paths, publishes only after confirmation and repeats without rewriting', async () => {
  const f = fixture(); try {
    const preview = await f.service.preview(f.plugin.id, ['cursor','claude']);
    assert.equal(preview.targets[0].state, 'format-ready');
    assert.equal(preview.targets[1].state, 'needs-adaptation');
    assert.equal(fs.existsSync(preview.targets[0].destination), false);
    await assert.rejects(f.service.apply(preview.id, false), /Confirm/);
    const result = await f.service.apply(preview.id, true);
    assert.equal(result.results[0].state, 'files-published');
    assert.equal(result.results[1].state, 'failed');
    assert.equal(result.installation, 'not-performed');
    assert.equal(result.results[0].loaded, 'unknown');
    assert.match(result.results[0].commands[0], /cursor-agent --plugin-dir/);
    assert.equal(fs.readFileSync(path.join(preview.targets[0].destination, 'bundle/README.md'), 'utf8'), '# Example');
    assert.equal((await f.service.apply(preview.id, true)).results[0].state, 'unchanged');
    assert.equal(fs.readFileSync(path.join(f.source, 'README.md'), 'utf8'), '# Example');
  } finally { f.close(); }
});

test('distribution keeps independent target changes and rejects changed sources and revoked targets', async () => {
  const f = fixture(); try {
    const preview = await f.service.preview(f.plugin.id, ['cursor']);
    await f.service.apply(preview.id, true);
    const file = path.join(preview.targets[0].destination, 'bundle/README.md');
    fs.writeFileSync(file, 'independent modification');
    const conflict = await f.service.preview(f.plugin.id, ['cursor']);
    assert.equal(conflict.targets[0].state, 'conflict');
    assert.equal((await f.service.apply(conflict.id, true)).results[0].state, 'failed');
    assert.equal(fs.readFileSync(file, 'utf8'), 'independent modification');
    f.config.targets[0].enabled = false;
    assert.equal((await f.service.apply(preview.id, true)).results[0].state, 'failed');
    fs.writeFileSync(path.join(f.source, 'README.md'), 'new upstream');
    await assert.rejects(f.service.apply(preview.id, true), /Source plugin changed/);
  } finally { f.close(); }
});

test('source symlinks and linked destinations cannot redirect delivery writes', async () => {
  const f = fixture(); try {
    fs.symlinkSync('/etc/hosts', path.join(f.source, 'unsafe'));
    await assert.rejects(f.service.preview(f.plugin.id, ['cursor']), /symbolic link/);
    fs.unlinkSync(path.join(f.source, 'unsafe'));
    const preview = await f.service.preview(f.plugin.id, ['cursor']);
    fs.mkdirSync(path.dirname(preview.targets[0].destination), { recursive: true });
    fs.symlinkSync(f.source, preview.targets[0].destination, 'dir');
    assert.equal((await f.service.apply(preview.id, true)).results[0].state, 'failed');
    assert.equal(fs.readFileSync(path.join(f.source, 'README.md'), 'utf8'), '# Example');
  } finally { f.close(); }
});

test('DSH adaptation uses explicit consent and an existing native agent, then reviews and publishes a draft', async () => {
  const f = fixture(); try {
    let calls = 0;
    f.service.agents = { get: id => id === 'live' ? { followup: async message => { calls++; assert.match(message.content[0].text, /plugin_task_save/); } } : undefined, list: () => [{ id: 'live' }] };
    const task = f.service.createTask(f.plugin.id, 'claude');
    assert.equal(calls, 0);
    await assert.rejects(f.service.startTask(task.id, 'live', false), /Confirm/);
    await assert.rejects(f.service.startTask(task.id, 'absent', true), /unavailable/);
    await f.service.startTask(task.id, 'live', true);
    await f.service.startTask(task.id, 'live', true);
    assert.equal(calls, 1);
    assert.throws(() => f.service.inputForAgent(task.id, 'other'), /selected DSH/);
    assert.equal(f.service.inputForAgent(task.id, 'live').target, 'claude');
    assert.throws(() => f.service.saveDraft(task.id, [], [], 'other'), /selected DSH/);
    const files = [{ path: '.claude-plugin/plugin.json', content: JSON.stringify({ name: 'example', version: '1' }) }, { path: 'README.md', content: '# Adapted' }];
    const saved = f.service.saveDraft(task.id, files, ['Hooks require runtime testing'], 'live');
    assert.equal(saved.state, 'draft');
    assert.equal(saved.validation, 'manifest-only');
    assert.equal(new PluginDelivery(f.config, { home: f.home }).tasks(f.plugin.id)[0].state, 'draft');
    const review = f.service.taskInput(task.id);
    assert.equal(review.originalFiles.find(file => file.path === 'README.md').content, '# Example');
    assert.equal(review.draftFiles.find(file => file.path === 'README.md').content, '# Adapted');
    const preview = await f.service.preview(f.plugin.id, ['claude'], task.id);
    const output = await f.service.apply(preview.id, true);
    assert.equal(output.results[0].state, 'files-published');
    assert.match(output.results[0].commands[0], /claude --plugin-dir/);
    assert.equal(fs.readFileSync(path.join(f.source, 'README.md'), 'utf8'), '# Example');
    f.service.saveDraft(task.id, files.map(file => file.path === 'README.md' ? { ...file, content: '# Revision 2' } : file), [], 'live');
    await assert.rejects(f.service.apply(preview.id, true), /draft changed/);
  } finally { f.close(); }
});

test('adaptation rejects path escapes, missing target manifests, license removal and file-directory collisions', async () => {
  const f = fixture(); try {
    fs.writeFileSync(path.join(f.source, 'LICENSE'), 'source license');
    f.service.agents = { get: () => ({ followup: async () => {} }) };
    const task = f.service.createTask(f.plugin.id, 'codex');
    await f.service.startTask(task.id, 'live', true);
    const manifest = { path: '.codex-plugin/plugin.json', content: '{"name":"adapted-example"}' };
    assert.throws(() => f.service.saveDraft(task.id, [{ path: '../escape', content: '' }], [], 'live'), /path/);
    assert.throws(() => f.service.saveDraft(task.id, [{ path: 'README.md', content: '' }], [], 'live'), /manifest/);
    assert.throws(() => f.service.saveDraft(task.id, [manifest], [], 'live'), /license/);
    assert.throws(() => f.service.saveDraft(task.id, [manifest, { path: 'a', content: '' }, { path: 'a/b', content: '' }], [], 'live'), /collision/);
    f.service.saveDraft(task.id, [manifest, { path: 'LICENSE', content: 'source license' }], [], 'live');
    const preview = await f.service.preview(f.plugin.id, ['codex'], task.id);
    const result = await f.service.apply(preview.id, true);
    const marketplace = JSON.parse(fs.readFileSync(path.join(preview.targets[0].destination, '.agents/plugins/marketplace.json')));
    assert.equal(marketplace.plugins[0].name, 'adapted-example');
    assert.match(result.results[0].commands[1], /adapted-example@personal-/);
    assert.equal(result.loaded, 'unknown');
  } finally { f.close(); }
});

test('unconfirmed native agent submission is recorded without automatically resending', async () => {
  const f = fixture(); try {
    let calls = 0;
    f.service.agents = { get: () => ({ followup: async () => { calls++; throw Error('connection failed'); } }) };
    const task = f.service.createTask(f.plugin.id, 'claude');
    await assert.rejects(f.service.startTask(task.id, 'live', true), /did not confirm/);
    assert.equal((await f.service.startTask(task.id, 'live', true)).state, 'dispatch-uncertain');
    assert.equal(calls, 1);
  } finally { f.close(); }
});
