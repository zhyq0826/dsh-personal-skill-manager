import { PluginDelivery } from './plugin-delivery.js';
import { scanPlugins } from './plugins.js';
/**
 * Model-facing skill library tool.
 *
 * The tool and the browser panel share the same core operations. A mutation
 * always resolves its target from a fresh scan, so a stale name cannot redirect
 * a write to a different same-name skill.
 */

import {
  addCatalogEntry,
  collectSkills,
  effectiveConfig,
  createSkill,
  deleteSkill,
  readSkill,
  saveSkillContent,
  sessionCwds,
  setInvocation,
  projectRootsFor,
  readLibraryManifest,
  removeCatalogEntry,
} from './core.js';
import { gitCommit, gitSync, restorePersonal } from './sync.js';
import { favoriteToCatalog, installCatalog } from './catalog.js';
import {
  collectAllSkills,
  discoverTargetOnly,
  distribute,
  distributeSkill,
  migrateToLibrary,
  readTargetSkill,
  saveAsMine,
  targetStates,
} from './targets.js';

const ACTIONS = [
  'plugin_task_read',
  'plugin_task_save',
  'plugins',
  'list',
  'read',
  'favorite',
  'save_as_mine',
  'install_catalog',
  'set_invocation',
  'create',
  'save',
  'distribute',
  'targets',
  'delete',
  'sync',
];

function compactSkill(skill) {
  return {
    name: skill.name,
    description: skill.description,
    path: skill.path,
    group: skill.group,
    linked: skill.linked,
    modelInvocable: skill.modelInvocable,
    userInvocable: skill.userInvocable,
    favorite: skill.favorite,
    favoriteKind: skill.favoriteKind,
    inLibrary: skill.inLibrary === true,
    inCatalog: skill.inCatalog === true,
    kind: skill.kind,
    clients: (skill.clients ?? []).map((client) => client.label ?? client.id),
    shadowed: skill.shadowed,
    duplicateCount: skill.duplicateCount,
    sameNameElsewhere: skill.sameNameElsewhere,
    editable: skill.editable,
    deletable: skill.deletable,
  };
}

function renderList(collected, query, group, favoritesOnly) {
  const needle = typeof query === 'string' ? query.trim().toLowerCase() : '';
  const groups = collected.groups
    .filter((entry) => group === undefined || entry.key === group)
    .map((entry) => ({
      key: entry.key,
      title: entry.title,
      hint: entry.hint,
      skills: entry.skills
        .filter((skill) => {
          if (favoritesOnly === true && !skill.favorite) return false;
          if (needle === '') return true;
          return [skill.name, skill.description, skill.path ?? '', skill.provider ?? '']
            .some((value) => value.toLowerCase().includes(needle));
        })
        .map(compactSkill),
    }))
    .filter((entry) => entry.skills.length > 0);
  const total = groups.reduce((sum, entry) => sum + entry.skills.length, 0);
  return { groups, total };
}

export function registerTool(ctx, baseConfig) {
  return ctx.tools.register({
    name: 'skill_hub',
    description:
      'Manage my skills for every code agent. Written skills live in skills/ and are the only bundles distributed to Codex, Claude Code, Cursor, and DSH. A favorite records community source metadata in the repository catalog so it can be reinstalled later; it does not copy the bundle into skills/. Use save_as_mine only when the user wants to maintain that bundle. Use install_catalog to reinstall favorites, and distribute only for written skills.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        taskId: { type: 'string', description: 'Plugin adaptation task ID provided by the user.' },
        files: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] }, description: 'Complete adapted text bundle, never absolute paths.' },
        limitations: { type: 'array', items: { type: 'string' }, description: 'Unsupported behavior and unverified capabilities.' },
        action: {
          type: 'string',
          enum: ACTIONS,
          description: 'Operation to perform.',
        },
        name: {
          type: 'string',
          description: 'Skill name in kebab-case. Required by mutations that target an existing skill.',
        },
        path: {
          type: 'string',
          description:
            'Exact SKILL.md path from a previous list result. Required when several entries share a name.',
        },
        content: {
          type: 'string',
          description: 'Full SKILL.md content for save, or the body for create.',
        },
        description: {
          type: 'string',
          description: 'Routing description for create.',
        },
        whenToUse: {
          type: 'string',
          description: 'Optional extra routing guidance for create.',
        },
        root: {
          type: 'string',
          enum: ['personal'],
          description: 'Create always writes to the personal library, the single source for every agent.',
        },
        cwd: {
          type: 'string',
          description: 'Workspace directory for a project-scoped operation.',
        },
        modelInvocable: {
          type: 'boolean',
          description: 'Whether the model may load the skill. Setting this rewrites frontmatter.',
        },
        userInvocable: {
          type: 'boolean',
          description: 'Whether a human may invoke the skill with /name. Setting this rewrites frontmatter.',
        },
        favorite: {
          type: 'boolean',
          description: 'Favorite state to set.',
        },
        confirm: {
          type: 'boolean',
          description: 'Must be true for delete, after the user agrees.',
        },
        query: {
          type: 'string',
          description: 'Case-insensitive filter for list.',
        },
        group: {
          type: 'string',
          description: 'Optional source group filter for list.',
        },
        favoritesOnly: {
          type: 'boolean',
          description: 'Only return favorited skills for list.',
        },
        syncMode: {
          type: 'string',
          enum: ['commit', 'sync', 'restore', 'distribute', 'install'],
          description:
            'For action sync: commit locally, commit+pull+push, restore from Git, or distribute the library to agent targets. install is accepted as a legacy alias for distribute.',
        },
        targetId: {
          type: 'string',
          description: 'For action collect: the target id (codex, claude, cursor, dsh, agents) to copy from.',
        },
        clientId: {
          type: 'string',
          description: 'For action favorite: the client id to collect from when the skill is not in the library.',
        },
        replaceConflicts: {
          type: 'boolean',
          description: 'For action distribute: back up and replace conflicting target content.',
        },
        targetIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'For action distribute with a name: target ids to update; omitted means every enabled target.',
        },
      },
      required: ['action'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        properties: {
          ok: { type: 'boolean' },
          action: { type: 'string' },
          summary: { type: 'string' },
          text: { type: 'string' },
        },
      },
      render(_args, value) {
        const text =
          value !== null && typeof value === 'object' && typeof value.text === 'string'
            ? value.text
            : value !== null && typeof value === 'object' && typeof value.summary === 'string'
              ? value.summary
              : JSON.stringify(value, null, 2);
        return [{ type: 'text', text }];
      },
    },
    async execute(args, exec) {
      const config = effectiveConfig(baseConfig);
      await migrateToLibrary(config).catch(() => undefined);
      const cwds = sessionCwds(ctx);
      let cwd = typeof args.cwd === 'string' && args.cwd.trim() !== '' ? args.cwd : cwds[0];
      if (cwd === undefined && exec.agent !== undefined && typeof ctx.workingDirectory?.ensure === 'function') {
        cwd = await ctx.workingDirectory.ensure(exec.agent, exec.signal).catch(() => undefined);
      }
      if (cwd === undefined) cwd = process.cwd();
      const collected = await collectSkills(config, {
        cwd,
        projectRoots: projectRootsFor(cwds, cwd),
        libraryOnly: true,
      });
      const autoCommit = () => {
        if (config.autoSync !== true) return;
        try {
          gitCommit(config);
        } catch {
          // A commit failure must not hide the successful skill operation.
        }
      };

      switch (args.action) {
        case 'plugin_task_read': return new PluginDelivery(config).inputForAgent(args.taskId, exec.agent?.id);
        case 'plugin_task_save': return new PluginDelivery(config).saveDraft(args.taskId, args.files, args.limitations, exec.agent?.id);
        case 'plugins': return scanPlugins(config);
        case 'list': {
          const all = await collectAllSkills(config);
          const needle = typeof args.query === 'string' ? args.query.trim().toLowerCase() : '';
          const filtered = all.skills.filter((skill) => {
            if (args.favoritesOnly === true && skill.inCatalog !== true && !(skill.inLibrary === true && skill.kind === 'collected')) return false;
            if (needle === '') return true;
            return [skill.name, skill.description, skill.path ?? '']
              .some((value) => String(value).toLowerCase().includes(needle));
          });
          const lines = [
            `Skills: ${filtered.length} of ${all.count} (library ${all.skills.filter((skill) => skill.inLibrary).length}; clients ${all.skills.filter((skill) => !skill.inLibrary).length}).`,
          ];
          for (const skill of filtered.slice(0, 120)) {
            const marks = [
              skill.inLibrary ? 'library' : 'client',
              skill.kind,
              skill.clients.map((client) => client.label ?? client.id).join('/'),
              skill.favorite ? 'favorite' : undefined,
            ]
              .filter(Boolean)
              .join(', ');
            lines.push(`- ${skill.name} [${marks}] — ${skill.description}`);
            if (skill.path !== undefined) lines.push(`  ${skill.path}`);
          }
          if (filtered.length > 120) lines.push('… more entries omitted; narrow the query.');
          return {
            ok: true,
            action: 'list',
            summary: lines.join('\n'),
            count: filtered.length,
            total: all.count,
            clients: all.clients,
            skills: filtered,
          };
        }
        case 'read': {
          let detail;
          try {
            detail = await readSkill(config, collected, { name: args.name, path: args.path });
          } catch (error) {
            detail = await readTargetSkill(config, { name: args.name, path: args.path });
            if (detail === undefined) throw error;
          }
          return {
            ok: true,
            action: 'read',
            summary: `Skill "${detail.name}" at ${detail.path} (${detail.files.length} files, ${detail.editable ? 'editable' : 'read-only'}).`,
            text: detail.content,
            ...detail,
          };
        }
        case 'favorite': {
          if (args.favorite === false) {
            const removed = removeCatalogEntry(config, args.name);
            if (config.autoSync === true) {
              try {
                gitCommit(config, { metadataOnly: true });
              } catch {
                // A commit failure must not hide the catalog update.
              }
            }
            return { ok: true, action: 'favorite', favorite: false, removed };
          }
          const manifest = readLibraryManifest(config);
          const meta = manifest.skills[args.name];
          if (meta?.kind === 'personal') {
            return { ok: true, action: 'favorite', favorite: false, alreadyMine: true, summary: `${args.name} is already a written skill.` };
          }
          const entry =
            meta?.kind === 'collected'
              ? addCatalogEntry(config, {
                  name: args.name,
                  source: meta.source ?? { kind: 'unknown', reason: 'legacy collected entry has no source' },
                  collectedFrom: meta.collectedFrom ?? null,
                  addedAt: meta.addedAt,
                })
              : favoriteToCatalog(config, { name: args.name, clientId: args.clientId });
          autoCommit();
          return {
            ok: true,
            action: 'favorite',
            favorite: true,
            catalog: true,
            summary: `Saved ${args.name} to the source catalog; it can be installed on another machine.`,
            ...entry,
          };
        }
        case 'set_invocation': {
          const result = await setInvocation(config, collected, args);
          autoCommit();
          return {
            ok: true,
            action: 'set_invocation',
            summary: `${args.name}: model ${result.modelInvocable ? 'available' : 'disabled'}, user ${
              result.userInvocable ? 'available' : 'disabled'
            }. The skill catalog refreshes on the next discovery pass.`,
            ...result,
          };
        }
        case 'create': {
          const result = await createSkill(config, { ...args, cwd });
          autoCommit();
          return {
            ok: true,
            action: 'create',
            summary: `Created ${result.name} at ${result.path}.`,
            ...result,
          };
        }
        case 'save': {
          const result = await saveSkillContent(config, collected, args);
          autoCommit();
          return {
            ok: true,
            action: 'save',
            summary: `Saved ${args.name}.${result.backup === undefined ? '' : ` Previous content: ${result.backup}`}`,
            ...result,
          };
        }
        case 'delete': {
          const result = await deleteSkill(config, collected, args);
          autoCommit();
          return {
            ok: true,
            action: 'delete',
            summary: `Moved ${result.name} to the trash at ${result.movedTo}.`,
            ...result,
          };
        }
        case 'distribute': {

          await migrateToLibrary(config);
          const result = await distribute(config, { replaceConflicts: args.replaceConflicts === true });
          return {
            ok: true,
            action: 'distribute',
            summary: `Distribution: ${result.linked} linked, ${result.copied} copied, ${result.present} present, ${result.conflicts} conflicts, ${result.failed} failed.`,
            result,
          };
        }
        case 'targets': {
          await migrateToLibrary(config);
          const names = new Set(collected.skills.map((skill) => skill.name));
          const rows = collected.skills.map((skill) => ({
            name: skill.name,
            targets: targetStates(config, skill),
          }));
          const discover = discoverTargetOnly(config, names);
          const lines = [`Targets: ${config.targets.filter((target) => target.enabled).map((target) => `${target.id}=${target.path}`).join(', ')}`];
          for (const row of rows) {
            lines.push(`- ${row.name}: ${row.targets.map((target) => `${target.id}:${target.state}`).join(', ')}`);
          }
          if (discover.length > 0) lines.push(`${discover.length} client-only skills can be favorited as source records.`);
          return { ok: true, action: 'targets', summary: lines.join('\n'), targets: config.targets, skills: rows, discover };
        }
        case 'install_catalog': {
          const result = await installCatalog(config, {
            names: args.name ? [args.name] : undefined,
            targetIds: args.targetIds,
            replaceConflicts: args.replaceConflicts === true,
          });
          return {
            ok: true,
            action: 'install_catalog',
            summary: `Catalog install: ${result.installed} installed, ${result.present} present, ${result.conflicts} conflicts, ${result.failed} failed, ${result.needsSource} need a source.`,
            result,
          };
        }
        case 'sync': {

          const mode = typeof args.syncMode === 'string' ? args.syncMode : 'sync';
          let result;
          if (mode === 'commit') result = gitCommit(config);
          else if (mode === 'restore') result = await restorePersonal(config);
          else if (mode === 'distribute' || mode === 'install') {
            await migrateToLibrary(config);
            result = await distribute(config, { replaceConflicts: args.replaceConflicts === true });
          } else result = await gitSync(config);
          const summary =
            mode === 'distribute' || mode === 'install'
              ? `Distribution: ${result.linked} linked, ${result.copied} copied, ${result.present} present, ${result.conflicts} conflicts, ${result.failed} failed.`
              : mode === 'restore'
                ? `Restored the library; distribution: ${result.distribution.conflicts} conflicts, ${result.distribution.linked} linked, ${result.distribution.copied} copied.`
                : `Personal library ${mode}: changed=${String(result.changed)}, commit=${String(result.commit ?? '—')}, pushed=${String(result.pushed ?? false)}${result.error ? `, error=${result.error}` : ''}`;
          return { ok: true, action: 'sync', mode, summary, result };
        }
        default:
          throw new Error(`unknown action "${String(args.action)}"`);
      }
    },
    presentCall(args) {
      const title =
        args.action === 'read'
          ? `Read skill ${args.name ?? ''}`
          : args.action === 'list'
            ? 'List skills'
            : `Skill library: ${args.action}`;
      return { card: 'generic', title, kind: args.action === 'list' ? 'search' : 'other', rawInput: args };
    },
  });
}
