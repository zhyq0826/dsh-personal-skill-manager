import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildSkillFile,
  collectSkills,
  createSkill,
  deleteSkill,
  digest,
  manifestPath,
  parseFrontmatter,
  readSkill,
  resolveConfig,
  saveAsPersonal,
  saveSkillContent,
  setFavorite,
  setFrontmatterFields,
  setInvocation,
} from '../lib/core.js';

function workspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-hub-test-'));
  const dshHome = path.join(root, 'dsh-home');
  const agentsHome = path.join(root, 'agents-home');
  const project = path.join(root, 'project');
  const custom = path.join(root, 'custom');
  fs.mkdirSync(dshHome, { recursive: true });
  fs.mkdirSync(agentsHome, { recursive: true });
  fs.mkdirSync(project, { recursive: true });
  fs.mkdirSync(custom, { recursive: true });
  const config = resolveConfig({
    dshHome,
    agentsHome,
    customSkillDirs: [custom],
  });
  return { root, dshHome, agentsHome, project, custom, config };
}

function writeSkill(root, name, { description = `${name} description`, body = `# ${name}\n\nBody.`, extra = '' } = {}) {
  const directory = path.join(root, name);
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'SKILL.md');
  fs.writeFileSync(
    file,
    `---\nname: ${name}\ndescription: ${description}\n${extra}---\n\n${body}\n`,
    'utf8',
  );
  return file;
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

test('frontmatter toggles preserve the body and other fields', () => {
  const original = `---\nname: alpha\ndescription: 'Alpha skill'\nwhenToUse: 'When alpha'\n---\n\n# Alpha\n\nBody text.\n`;
  const parsed = parseFrontmatter(original);
  assert.equal(parsed.name, 'alpha');
  assert.equal(parsed.description, 'Alpha skill');
  assert.equal(parsed.whenToUse, 'When alpha');

  const disabled = setFrontmatterFields(original, { modelInvocable: false });
  assert.match(disabled, /disable-model-invocation: true/);
  assert.match(disabled, /# Alpha\n\nBody text\./);
  assert.equal(parseFrontmatter(disabled).disableModelInvocation, true);

  const enabled = setFrontmatterFields(disabled, { modelInvocable: true });
  assert.doesNotMatch(enabled, /disable-model-invocation/);
  assert.match(enabled, /description: 'Alpha skill'/);

  const noUser = setFrontmatterFields(enabled, { userInvocable: false });
  assert.match(noUser, /user-invocable: false/);
  assert.equal(parseFrontmatter(noUser).userInvocable, false);
});

test('collection keeps same-name entries distinct and reports the winner', async () => {
  const { root, dshHome, project, config } = workspace();
  try {
    writeSkill(path.join(dshHome, 'skills'), 'alpha', { description: 'personal alpha' });
    writeSkill(path.join(project, '.dsh', 'skills'), 'alpha', { description: 'project alpha' });
    writeSkill(path.join(project, '.dsh', 'skills'), 'beta');
    writeSkill(path.join(project, '.agents', 'skills'), 'alpha', { description: 'agents alpha' });
    writeSkill(path.join(project, '.agents', 'skills'), 'gamma');

    const collected = await collectSkills(config, {
      cwd: project,
      projectRoots: [project],
    });
    const alpha = collected.skills.filter((skill) => skill.name === 'alpha');
    assert.equal(alpha.length, 3);
    for (const entry of alpha) {
      assert.equal(entry.sameNameElsewhere, entry.group === 'personal' ? 2 : 1);
      assert.equal(entry.group === 'personal' ? entry.duplicateCount === 1 : entry.duplicateCount === 2, true);
    }
    assert.equal(alpha.find((entry) => entry.group === 'project-dsh').winner, true);
    assert.equal(alpha.find((entry) => entry.group === 'project-agents').shadowed, true);
    assert.equal(alpha.find((entry) => entry.group === 'personal').winner, true);
    assert.deepEqual(
      collected.groups.map((group) => group.key).sort(),
      ['personal', 'project-agents', 'project-dsh'],
    );
  } finally {
    cleanup(root);
  }
});

test('favorites round-trip through the plugin state file', async () => {
  const { root, dshHome, project, config } = workspace();
  try {
    const file = writeSkill(path.join(dshHome, 'skills'), 'alpha');
    const collected = await collectSkills(config, { cwd: project, projectRoots: [project] });
    assert.equal(collected.skills[0].favorite, false);

    const set = setFavorite(config, collected, { name: 'alpha', path: file, value: true });
    assert.equal(set.favorite, true);
    assert.ok(fs.existsSync(manifestPath(config)));

    const again = await collectSkills(config, { cwd: project, projectRoots: [project] });
    assert.equal(again.skills[0].favorite, true);

    setFavorite(config, again, { name: 'alpha', path: file, value: false });
    const off = await collectSkills(config, { cwd: project, projectRoots: [project] });
    assert.equal(off.skills[0].favorite, false);
  } finally {
    cleanup(root);
  }
});

test('invocation writes a backup and rejects symbolic links', async () => {
  const { root, dshHome, project, config } = workspace();
  try {
    const file = writeSkill(path.join(dshHome, 'skills'), 'alpha');
    const collected = await collectSkills(config, { cwd: project, projectRoots: [project] });
    const result = await setInvocation(config, collected, { name: 'alpha', path: file, modelInvocable: false });
    assert.equal(result.changed, true);
    assert.equal(parseFrontmatter(fs.readFileSync(file, 'utf8')).disableModelInvocation, true);
    assert.ok(fs.existsSync(path.join(result.backup, 'SKILL.md')));

    const linked = path.join(config.dshHome, 'skills', 'linked');
    fs.symlinkSync(path.dirname(file), linked, 'dir');
    const next = await collectSkills(config, { cwd: project, projectRoots: [project] });
    const linkedEntry = next.skills.find((skill) => skill.path === path.join(linked, 'SKILL.md'));
    assert.ok(linkedEntry);
    assert.equal(linkedEntry.linked, true);
    await assert.rejects(
      setInvocation(config, next, { name: linkedEntry.name, path: linkedEntry.path, userInvocable: false }),
      /symbolic link/,
    );
  } finally {
    cleanup(root);
  }
});

test('save rejects a stale digest and accepts an explicit rewrite', async () => {
  const { root, dshHome, project, config } = workspace();
  try {
    const file = writeSkill(path.join(dshHome, 'skills'), 'alpha');
    const collected = await collectSkills(config, { cwd: project, projectRoots: [project] });
    const current = fs.readFileSync(file, 'utf8');
    const edited = current.replace('Body.', 'Edited body.');

    await assert.rejects(
      saveSkillContent(config, collected, {
        name: 'alpha',
        path: file,
        content: edited,
        expectedDigest: 'not-the-current-digest',
      }),
      /changed after it was loaded/,
    );

    const result = await saveSkillContent(config, collected, {
      name: 'alpha',
      path: file,
      content: edited,
      expectedDigest: digest(current),
    });
    assert.equal(result.changed, true);
    assert.match(fs.readFileSync(file, 'utf8'), /Edited body/);
    assert.ok(fs.existsSync(path.join(result.backup, 'SKILL.md')));

    await assert.rejects(
      saveSkillContent(config, collected, {
        name: 'alpha',
        path: file,
        content: edited.replace('name: alpha', 'name: beta'),
      }),
      /name must stay/,
    );
  } finally {
    cleanup(root);
  }
});

test('create writes a standard skill and refuses an existing target', async () => {
  const { root, project, config } = workspace();
  try {
    const created = await createSkill(config, {
      root: 'project',
      cwd: project,
      name: 'new-skill',
      description: 'A new skill',
      whenToUse: 'When testing',
      content: '# New\n\nDo the thing.',
    });
    assert.ok(fs.existsSync(created.path));
    const parsed = parseFrontmatter(fs.readFileSync(created.path, 'utf8'));
    assert.equal(parsed.name, 'new-skill');
    assert.equal(parsed.description, 'A new skill');
    assert.equal(parsed.whenToUse, 'When testing');

    await assert.rejects(
      createSkill(config, {
        root: 'project',
        cwd: project,
        name: 'new-skill',
        description: 'Duplicate',
        content: '# Duplicate',
      }),
      /already exists/,
    );
    await assert.rejects(
      createSkill(config, {
        root: 'project',
        cwd: project,
        name: 'Bad Name',
        description: 'Bad',
        content: '# Bad',
      }),
      /kebab-case/,
    );
  } finally {
    cleanup(root);
  }
});

test('read lists supporting files and save-as-personal copies them', async () => {
  const { root, dshHome, project, config } = workspace();
  try {
    const projectRoot = path.join(project, '.dsh', 'skills');
    const file = writeSkill(projectRoot, 'alpha');
    fs.mkdirSync(path.join(path.dirname(file), 'references'), { recursive: true });
    fs.writeFileSync(path.join(path.dirname(file), 'references', 'guide.md'), 'guide\n');
    fs.chmodSync(path.join(path.dirname(file), 'references', 'guide.md'), 0o755);

    const collected = await collectSkills(config, { cwd: project, projectRoots: [project] });
    const detail = await readSkill(config, collected, { name: 'alpha', path: file });
    assert.equal(detail.files.length, 2);
    assert.ok(detail.files.some((entry) => entry.path === 'references/guide.md'));

    const copied = await saveAsPersonal(config, collected, { name: 'alpha', path: file });
    assert.equal(copied.files, 2);
    assert.ok(fs.existsSync(path.join(dshHome, 'skills', 'alpha', 'references', 'guide.md')));
    assert.equal(
      fs.statSync(path.join(dshHome, 'skills', 'alpha', 'references', 'guide.md')).mode & 0o777,
      0o755,
    );

    await assert.rejects(
      saveAsPersonal(config, collected, { name: 'alpha', path: file }),
      /already exists/,
    );
  } finally {
    cleanup(root);
  }
});

test('delete requires confirmation and keeps a recoverable copy', async () => {
  const { root, dshHome, project, config } = workspace();
  try {
    const file = writeSkill(path.join(dshHome, 'skills'), 'alpha');
    const collected = await collectSkills(config, { cwd: project, projectRoots: [project] });

    await assert.rejects(
      deleteSkill(config, collected, { name: 'alpha', path: file }),
      /confirm/,
    );
    assert.ok(fs.existsSync(file));

    const result = await deleteSkill(config, collected, { name: 'alpha', path: file, confirm: true });
    assert.equal(fs.existsSync(file), false);
    assert.ok(fs.existsSync(path.join(result.movedTo, 'SKILL.md')));
  } finally {
    cleanup(root);
  }
});

test('buildSkillFile quotes descriptions containing quotes and colons', () => {
  const content = buildSkillFile({
    name: 'quoted',
    description: "A skill: it's quoted",
    content: '# Quoted',
  });
  const parsed = parseFrontmatter(content);
  assert.equal(parsed.name, 'quoted');
  assert.equal(parsed.description, "A skill: it's quoted");
});
