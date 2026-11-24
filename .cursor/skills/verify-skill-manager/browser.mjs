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
    const tab = name => panel.getByRole('tab', { name, exact: true });
    const openSync = () => button(/^(Sync|同步)$/).click();
    await snapshot('ready', 'Opened the native panel and found the seeded library');
    if (['all', 'search'].includes(scenario)) {
      const desktop = page.viewportSize();
      for (const width of [desktop.width, 390]) {
        await page.setViewportSize({ ...desktop, width });
        for (const selector of ['.skh-list', '.skh-detail']) {
          const inset = await panel.locator(selector).evaluate(pane => {
            const bounds = pane.getBoundingClientRect();
            const content = pane.firstElementChild.getBoundingClientRect();
            return Math.min(content.left - bounds.left, bounds.right - content.right, content.top - bounds.top);
          });
          assert.ok(inset >= 14, `${selector} has only ${inset}px of space at ${width}px`);
        }
      }
      await page.setViewportSize(desktop);
      const filter = button(/^(Filter by client|按客户端筛选)$/);
      await filter.click();
      await page.getByRole('menuitem', { name: 'DSH', exact: true }).waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('menu').waitFor({ state: 'hidden' });
      const beta = rows.filter({ hasText: 'qa-beta' });
      const background = () => beta.evaluate(async row => {
        getComputedStyle(row).backgroundColor;
        await Promise.all(row.getAnimations().map(animation => animation.finished));
        return getComputedStyle(row).backgroundColor;
      });
      await search.hover();
      const idleColor = await background();
      await beta.hover();
      const hoverColor = await background();
      assert.notEqual(hoverColor, idleColor);
      await search.hover();
      assert.equal(await background(), idleColor);
      await beta.click();
      const selectedColor = await background();
      assert.notEqual(selectedColor, hoverColor);
      await search.hover();
      assert.equal(await background(), selectedColor);
      await search.fill('qa-beta');
      await rows.filter({ hasText: 'qa-beta' }).click();
      await panel.locator('.skh-detail-title').getByText('qa-beta', { exact: true }).waitFor();
      assert.equal(await rows.count(), 1);
      await snapshot('search-match', 'Filtered the list and opened qa-beta');
      const editor = panel.locator('.skh-detail textarea');
      assert.equal(await editor.inputValue(), fs.readFileSync(local('library/skills/qa-beta/SKILL.md'), 'utf8'));
      const draft = (await editor.inputValue()) + '\nUnsaved QA edit';
      await editor.fill(draft);
      await search.fill('no-such-qa-skill');
      await panel.getByText(/^(No skills found\.|没有找到技能。|没有匹配的技能。)$/).waitFor();
      assert.equal(await rows.count(), 0);
      assert.equal(await editor.count(), 0);
      assert.equal(await button(/^(Distribute to DSH|分发到 DSH)$/).count(), 0);
      await panel.getByText(/unsaved draft for qa-beta|「qa-beta」的未保存草稿/i).waitFor();
      await snapshot('search-empty', 'No stale editor or distribution action; draft identified');
      await button(/^(Clear search|清除搜索)$/).click();
      assert.equal(await editor.inputValue(), draft);
      await rows.filter({ hasText: 'qa-alpha' }).waitFor();
      const conflictDir = local('dsh/skills/qa-beta');
      fs.mkdirSync(conflictDir);
      const conflictFile = path.join(conflictDir, 'SKILL.md');
      fs.writeFileSync(conflictFile, '---\nname: qa-beta\n---\nLocal variant');
      await button(/^(Refresh|刷新)$/).click();
      await button(/Pending conflicts\s*1|待处理冲突\s*1/).click();
      assert.equal(await rows.count(), 1);
      assert.match(await rows.first().innerText(), /qa-beta/);
      const replace = panel.getByRole('button', { name: /Back up and replace the DSH version|备份并替换 DSH 版本/ });
      const tooltip = page.getByRole('tooltip').filter({ hasText: /Back up the current DSH version|先备份 DSH 中现有的版本/ });
      await replace.hover();
      await tooltip.waitFor({ state: 'visible', timeout: 1000 });
      assert.match(await tooltip.innerText(), /Back up the current DSH version|先备份 DSH 中现有的版本/);
      assert.match(await tooltip.innerText(), /Unsaved edits are excluded|本次分发不包含未保存的修改/);
      await search.hover();
      assert.equal(await tooltip.isVisible(), false);
      await replace.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await tooltip.waitFor({ state: 'visible', timeout: 1000 });
      await page.keyboard.press('Escape');
      assert.equal(await tooltip.isVisible(), false);
      await snapshot('conflict-filter', 'Only the skill with conflicting client content is listed');
      fs.unlinkSync(conflictFile);
      fs.rmdirSync(conflictDir);
      await button(/^(All skills|全部技能)\s*2$/).click();
      const communityDir = local('dsh/skills/qa-community');
      fs.mkdirSync(communityDir);
      const communityFile = path.join(communityDir, 'SKILL.md');
      fs.writeFileSync(communityFile, '---\nname: qa-community\ndescription: Community example\n---\nExample');
      await button(/^(Refresh|刷新)$/).click();
      await rows.filter({ hasText: 'qa-community' }).waitFor();
      const caret = 12;
      await editor.evaluate((element, position) => element.setSelectionRange(position, position), caret);
      const top = (await editor.boundingBox()).y;
      await clickWrite(rows.filter({ hasText: 'qa-community' }).getByRole('button', { name: /^(Favorite|收藏)$/ }), 'favorite');
      await rows.filter({ hasText: 'qa-community' }).getByRole('button', { name: /^(Remove favorite|取消收藏)$/ }).waitFor();
      assert.equal(await editor.inputValue(), draft);
      assert.equal(await editor.evaluate(element => element.selectionStart), caret);
      assert.equal((await editor.boundingBox()).y, top);
      await rows.filter({ hasText: 'qa-alpha' }).click();
      await rows.filter({ hasText: 'qa-beta' }).click();
      assert.equal(await editor.inputValue(), draft);
      await openSync();
      await button(/^(Back to skills|返回技能)$/).click();
      assert.equal(await editor.inputValue(), draft);
      await button(/^(Reset|Revert|还原)$/).click();
      await button(/^(My favorites|我收藏的)\s*1$/).click();
      assert.equal(await rows.count(), 1);
      assert.match(await rows.first().innerText(), /qa-community/);
      await rows.first().click();
      await panel.locator('.skh-detail-title').filter({ hasText: 'qa-community' }).waitFor();
      assert.equal(await panel.locator('.skh-pre').textContent(), fs.readFileSync(communityFile, 'utf8'));
      await snapshot('favorites', 'Opened the favorite from its dedicated tab');
      fs.unlinkSync(communityFile);
      fs.rmdirSync(communityDir);
      await button(/^(Refresh|刷新)$/).click();
      await panel.getByText(/^(Not installed locally|本机未安装)$/).waitFor();
      await clickWrite(panel.locator('.skh-list').getByRole('button', { name: /^(Remove favorite|取消收藏)$/ }), 'favorite');
      await button(/^(My favorites|我收藏的)\s*0$/).waitFor();
      await button(/^(All skills|全部技能)\s*2$/).click();
      await button(/^(Refresh|刷新)$/).click();
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
      const single = button(/^(Distribute to DSH|分发到 DSH)$/);
      await single.waitFor();
      assert.ok(!fs.existsSync(local('dsh/skills/qa-alpha')));
      await snapshot('distribution-before', 'DSH target is missing');
      await clickWrite(single, 'distribute-skill');
      checkLink('qa-alpha');
      await panel.locator('.skh-target-action').getByRole('status').filter({ hasText: /Linked|已链接/ }).waitFor();
      await openSync();
      await tab(/^(Use on this computer|在本机使用)$/).click();
      const client = panel.locator('.skh-local-client summary').filter({ hasText: 'DSH' });
      await client.filter({ hasText: /1 pending|待分发 1 项/ }).waitFor();
      await snapshot('local-clients', 'Client overview with one installed and one pending skill');
      await client.click();
      await panel.locator('.skh-local-client li').filter({ hasText: 'qa-beta' }).waitFor();
      const settings = client;
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
      await tab(/^(Library sync|个人库同步)$/).click();
      await button(/^(Sync personal library|同步个人库)$/).waitFor();
      await tab(/^(Use on this computer|在本机使用)$/).click();
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
      await client.filter({ hasText: /2 distributed|已分发 2 项/ }).waitFor();
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
      const viewport = page.viewportSize();
      const tabs = panel.getByRole('tablist');
      for (const width of [viewport.width, 390]) {
        await page.setViewportSize({ ...viewport, width });
        assert.ok(await tabs.isVisible());
        const geometry = await tabs.evaluate(nav => ({ height: nav.clientHeight, contentHeight: nav.scrollHeight, width: nav.clientWidth, contentWidth: nav.scrollWidth }));
        assert.equal(geometry.contentHeight, geometry.height, `Vertical tab overflow at ${width}px`);
        assert.equal(geometry.contentWidth, geometry.width, `Horizontal tab overflow at ${width}px`);
      }
      await page.setViewportSize(viewport);
      assert.equal(await panel.locator('.skh-toolbar, .skh-list').count(), 0);
      assert.equal(await panel.getByLabel(/^(Git remote|Git 远端)$/).isVisible(), false);
      await tab(/^(Restore on another computer|换机恢复)$/).click();
      await button(/^(Restore from Git|从 Git 恢复)$/).waitFor();
      await snapshot('restore', 'Verified recovery entry and available actions');
      await tab(/^(Library sync|个人库同步)$/).click();
      assert.ok(await sync.isEnabled());
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
