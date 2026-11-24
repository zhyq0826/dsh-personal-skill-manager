#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import manifest from '../../../package.json' with { type: 'json' };

const [scenario, scratch, proof] = process.argv.slice(2);
const local = (...parts) => path.join(scratch, ...parts);
const read = (file) => fs.readFileSync(local(file), 'utf8').trim();
const port = Number(read('port'));
const pid = Number(read('pid'));
const origin = `http://127.0.0.1:${port}`;
const address = read('host.log').match(/dsh web: (http:\/\/127\.0\.0\.1:\d+\/\?token=[\w-]+)/)?.[1];
assert.ok(address, 'DSH did not announce a usable session URL');
assert.equal(new URL(address).origin, origin);
const bundle = fs.readFileSync(new URL('../../../dist/client.js', import.meta.url));
const digest = createHash('sha256').update(bundle).digest('hex');

async function doctor() {
  const listeners = execFileSync('lsof', ['-nP', '-tiTCP:' + port, '-sTCP:LISTEN'], { encoding: 'utf8' });
  assert.ok(listeners.trim().split(/\s+/).includes(String(pid)), 'port owner differs from the launched DSH');
  const response = await fetch(origin + '/api/skill-hub/health', {
    headers: { authorization: 'Bearer ' + new URL(address).searchParams.get('token') },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.plugin, 'dsh-personal-skill-manager');
  assert.equal(health.ok, true);
  const installed = local('dsh/profiles/web/node_modules', manifest.name, manifest.exports['./client']);
  assert.ok(bundle.equals(fs.readFileSync(installed)), 'profile resolves a different client build');
  console.log(`Doctor OK: pid ${pid}, port ${port}, ${manifest.name}@${manifest.version}, sha256 ${digest}`);
}

async function drive() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const actions = [];
  const errors = [];
  let result = 'failed';
  try {
    const page = await browser.newPage({ locale: process.env.VERIFY_LOCALE || 'zh-CN', viewport: { width: 1360, height: 900 } });
    page.setDefaultTimeout(15000);
    const scripts = [];
    page.on('response', response => {
      if (response.status() === 200 && /javascript/.test(response.headers()['content-type'] ?? '')) scripts.push(response);
    });
    page.on('pageerror', error => errors.push(error.message));
    const panel = page.locator('.skh-root');
    const snapshot = async (step, detail) => {
      await panel.screenshot({ path: path.join(proof, step + '.png') });
      actions.push({ step, detail });
    };
    const clickWrite = async (button, route) => {
      const [response] = await Promise.all([
        page.waitForResponse(res => res.url() === origin + '/api/skill-hub/' + route && res.request().method() === 'POST'),
        button.click(),
      ]);
      assert.equal(response.status(), 200);
      assert.equal((await response.json()).ok, true);
      actions.push({ route, status: response.status() });
    };
    await page.goto(address);
    await page.getByRole('button', { name: /^(Continue|继续)$/ }).click({ timeout: 4000 }).catch(() => {});
    await page.getByRole('dialog').getByRole('button', { name: /^(Close|关闭)$/ }).click({ timeout: 2500 }).catch(() => {});
    await page.getByRole('button', { name: /^(My skills|我的技能)$/ }).first().click();
    await panel.getByText('qa-alpha', { exact: true }).first().waitFor();
    assert.equal(await panel.locator('.skh-version').innerText(), 'v' + manifest.version);
    const bytes = await Promise.all(scripts.map(script => script.body().catch(() => Buffer.alloc(0))));
    assert.ok(bytes.some(body => body.includes(bundle)), 'browser did not receive this build');
    const search = panel.locator('.skh-toolbar input');
    const rows = panel.locator('.skh-row');
    const button = name => panel.getByRole('button', { name, exact: true });
    const openSync = () => button(/^(Sync|同步)$/).click();
    await snapshot('ready', 'Opened the native panel and found the seeded library');
    if (['all', 'search'].includes(scenario)) {
      await search.fill('qa-beta');
      await rows.filter({ hasText: 'qa-beta' }).click();
      await panel.locator('.skh-detail-title').getByText('qa-beta', { exact: true }).waitFor();
      assert.equal(await rows.count(), 1);
      await snapshot('search-match', 'Filtered the list and opened qa-beta');
      const editor = panel.locator('.skh-detail textarea');
      const draft = (await editor.inputValue()) + '\nUnsaved QA edit';
      await editor.fill(draft);
      await search.fill('no-such-qa-skill');
      await panel.getByText(/^(No skills found\.|没有找到技能。|没有匹配的技能。)$/).waitFor();
      assert.equal(await rows.count(), 0);
      assert.equal(await editor.count(), 0);
      assert.equal(await button(/^(Distribute here|分发到此客户端)$/).count(), 0);
      await panel.getByText(/unsaved draft for qa-beta|「qa-beta」的未保存草稿/i).waitFor();
      await snapshot('search-empty', 'No stale editor or distribution action; draft identified');
      await button(/^(Clear search|清除搜索)$/).click();
      assert.equal(await editor.inputValue(), draft);
      await editor.fill(read('library/skills/qa-beta/SKILL.md'));
      await rows.filter({ hasText: 'qa-alpha' }).waitFor();
    }
    if (['all', 'distribution'].includes(scenario)) {
      const checkLink = name => {
        const link = local('dsh/skills', name);
        assert.ok(fs.lstatSync(link).isSymbolicLink());
        assert.equal(fs.realpathSync(link), fs.realpathSync(local('library/skills', name)));
        assert.match(fs.readFileSync(path.join(link, 'SKILL.md'), 'utf8'), new RegExp('Body of ' + name));
        actions.push({ linked: name, target: fs.readlinkSync(link) });
      };
      await rows.filter({ hasText: 'qa-alpha' }).click();
      const single = button(/^(Distribute here|分发到此客户端)$/);
      await single.waitFor();
      assert.ok(!fs.existsSync(local('dsh/skills/qa-alpha')));
      await snapshot('distribution-before', 'DSH target is missing');
      await clickWrite(single, 'distribute-skill');
      checkLink('qa-alpha');
      await panel.getByRole('status').filter({ hasText: /qa-alpha · DSH · (1 newly linked|新增链接 1 项)/ }).waitFor();
      await openSync();
      await button(/^(Use on this computer|在本机使用)$/).click();
      const client = panel.locator('.skh-local-client summary').filter({ hasText: 'DSH' });
      await client.filter({ hasText: /1 pending|待分发 1 项/ }).waitFor();
      await snapshot('local-clients', 'Client overview with one installed and one pending skill');
      await client.click();
      await panel.locator('.skh-local-client li').filter({ hasText: 'qa-beta' }).waitFor();
      const settings = panel.locator('summary').filter({ hasText: /^(Client settings|客户端设置)$/ });
      await settings.click();
      assert.equal(await client.isVisible(), true);
      await panel.getByText(/Reads the original file|读取个人库原文件/).waitFor();
      const mode = panel.locator('.skh-local-config select').first();
      await snapshot('client-settings', 'Edit the enabled client with directory collapsed');
      await mode.selectOption('copy');
      await panel.getByText(/Uses a separate copy|使用独立副本。/).first().waitFor();
      page.once('dialog', dialog => dialog.dismiss());
      await button(/^(Back to skills|返回技能)$/).click();
      assert.equal(await mode.inputValue(), 'copy');
      page.once('dialog', dialog => dialog.accept());
      await button(/^(Library sync|个人库同步)$/).click();
      await button(/^(Sync personal library|同步个人库)$/).waitFor();
      await button(/^(Use on this computer|在本机使用)$/).click();
      await settings.click();
      assert.equal(await mode.inputValue(), 'link');
      await mode.selectOption('copy');
      await button(/^(Discard changes|撤销修改)$/).click();
      assert.equal(await mode.inputValue(), 'link');
      const startup = panel.getByLabel(/^(Distribute to clients on startup|启动时自动分发到客户端)$/);
      await startup.check();
      await clickWrite(button(/^(Save settings|保存设置)$/), 'settings');
      assert.equal(JSON.parse(read('dsh/skill-hub/settings.json')).autoDistribute, true);
      assert.equal(await startup.isChecked(), true);
      await settings.click();
      assert.equal(await mode.isVisible(), false);
      const distribute = button(/^(Distribute 1 to DSH|分发 1 项到 DSH)$/);
      await clickWrite(distribute, 'distribute');
      checkLink('qa-beta');
      const feedback = panel.getByRole('status').filter({ hasText: 'DSH' });
      await feedback.filter({ hasText: /1 already present|已有 1 项/ }).filter({ hasText: /1 newly linked|新增链接 1 项/ }).waitFor();
      await client.filter({ hasText: /2 in place|已就位 2 项/ }).waitFor();
      assert.equal(await distribute.count(), 0);
      await snapshot('distribution-after', 'Both installed links resolve to the personal library');
      await settings.click();
      await mode.selectOption('copy');
      page.once('dialog', dialog => dialog.accept());
      await button(/^(Back to skills|返回技能)$/).click();
      await rows.first().waitFor();
      assert.equal(JSON.parse(read('dsh/skill-hub/settings.json')).targets.find(target => target.id === 'dsh').mode, 'link');
    }
    if (['all', 'sync'].includes(scenario)) {
      await openSync();
      const sync = button(/^(Sync personal library|同步个人库)$/);
      await sync.waitFor();
      assert.equal(await panel.locator('.skh-toolbar, .skh-list').count(), 0);
      assert.equal(await panel.getByLabel(/^(Git remote|Git 远端)$/).isVisible(), false);
      await button(/^(Restore on another computer|换机恢复)$/).click();
      await button(/^(Restore from Git|从 Git 恢复)$/).waitFor();
      await snapshot('restore', 'Verified recovery entry and available actions');
      await button(/^(Library sync|个人库同步)$/).click();
      assert.match(await sync.getAttribute('class'), /skh-btn-primary/);
      assert.equal(await button(/^(Back up and replace conflicts|备份并替换冲突)$/).count(), 0);
      const git = args => execFileSync('git', args, { cwd: scratch, encoding: 'utf8' }).trim();
      assert.equal(git(['--git-dir=remote.git', 'for-each-ref', 'refs/heads/']), '');
      await snapshot('sync-before', 'Configured local bare remote has no branches');
      await clickWrite(button(/^(Sync personal library|同步个人库)$/), 'sync');
      const head = git(['--git-dir=remote.git', 'rev-parse', 'refs/heads/main']);
      assert.equal(head, git(['-C', 'library', 'rev-parse', 'HEAD']));
      assert.equal(git(['--git-dir=remote.git', 'show', 'main:skills/qa-beta/SKILL.md']), read('library/skills/qa-beta/SKILL.md'));
      await panel.getByText(/^(Personal library synced\.|个人库同步完成。)$/).waitFor();
      await snapshot('sync-after', { pushedCommit: head });
    }
    assert.deepEqual(errors, []);
    result = 'passed';
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(proof, 'result.json'), JSON.stringify({ result, scenario, version: manifest.version, digest, actions, errors }, null, 2));
  }
}

if (scenario === 'doctor') await doctor();
else await drive();
