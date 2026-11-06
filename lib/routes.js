/**
 * HTTP routes for the skill library.
 *
 * The browser panel is same-origin, so every route is fenced to a loopback
 * socket, a loopback Host header, and same-origin fetch metadata. Writes are
 * additionally identified by the panel's custom header. No route accepts an
 * arbitrary path: mutations resolve the exact file through a fresh scan.
 */

import {
  addCatalogEntry,
  collectSkills,
  createSkill,
  deleteSkill,
  effectiveConfig,
  readLibraryManifest,
  readSkill,
  removeCatalogEntry,
  saveSkillContent,
  sessionCwds,
  setInvocation,
  projectRootsFor,
  writeSettings,
} from './core.js';
import { favoriteToCatalog, installCatalog } from './catalog.js';
import {
  gitCommit,
  gitSync,
  personalDirWarning,
  restorePersonal,
  syncStatus,
} from './sync.js';
import {
  cleanupLegacyCollected,
  collectAllSkills,
  discoverTargetOnly,
  distribute,
  distributeSkill,
  migrateToLibrary,
  readTargetSkill,
  saveAsMine,
  targetStates,
} from './targets.js';

const BODY_LIMIT = 512 * 1024;
const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
};

function isIPv4Loopback(value) {
  const parts = value.split('.');
  return (
    parts.length === 4 &&
    parts[0] === '127' &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  );
}

function isLoopbackAddress(address) {
  if (address === undefined) return false;
  const normalized = address.toLowerCase();
  if (normalized === '::1') return true;
  if (normalized.startsWith('::ffff:')) return isIPv4Loopback(normalized.slice(7));
  return isIPv4Loopback(normalized);
}

function isLoopbackHostname(hostname) {
  if (hostname === 'localhost' || hostname === '[::1]') return true;
  return isIPv4Loopback(hostname);
}

function isTrustedRequest(request) {
  if (!isLoopbackAddress(request.socket?.remoteAddress)) return false;
  const host = request.headers.host;
  if (typeof host !== 'string') return false;
  let hostUrl;
  try {
    hostUrl = new URL(`http://${host}`);
  } catch {
    return false;
  }
  if (!isLoopbackHostname(hostUrl.hostname)) return false;
  if (request.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = request.headers.origin;
  if (origin !== undefined) {
    try {
      if (new URL(origin).host !== hostUrl.host) return false;
    } catch {
      return false;
    }
  }
  return true;
}

function writeJson(response, status, body) {
  response.writeHead(status, JSON_HEADERS);
  response.end(JSON.stringify(body));
}

function statusOf(error) {
  const status = error?.status;
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > BODY_LIMIT) {
      request.destroy();
      throw Object.assign(new Error('request body is too large'), { status: 413 });
    }
    chunks.push(buffer);
  }
  if (size === 0) throw Object.assign(new Error('request body is required'), { status: 400 });
  let value;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('request body must be valid JSON'), { status: 400 });
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw Object.assign(new Error('request body must be a JSON object'), { status: 400 });
  }
  return value;
}

function queryValue(request, name) {
  try {
    return new URL(request.url ?? '/', 'http://localhost').searchParams.get(name) ?? undefined;
  } catch {
    return undefined;
  }
}

function guard(request, response, method, needsWriteHeader = false) {
  if (!isTrustedRequest(request)) {
    writeJson(response, 403, { error: 'forbidden: loopback-only' });
    return false;
  }
  if (request.method !== method) {
    writeJson(response, 405, { error: `method not allowed: ${request.method}` });
    return false;
  }
  if (needsWriteHeader && request.headers['x-skill-hub'] !== '1') {
    writeJson(response, 403, { error: 'forbidden: missing skill-hub request header' });
    return false;
  }
  return true;
}

export function createRoutes(ctx, baseConfig) {
  const logger = {
    warn(error) {
      if (typeof ctx.logger?.warn === 'function') ctx.logger.warn(error);
      else console.warn('[dsh-personal-skill-manager]', error);
    },
  };

  const resolveCwd = (requested) => {
    const cwds = sessionCwds(ctx);
    const cwd = typeof requested === 'string' && requested.trim() !== '' ? requested : cwds[0] ?? process.cwd();
    const projectRoots = projectRootsFor(cwds, cwd);
    return { cwd, projectRoots };
  };

  const current = () => effectiveConfig(baseConfig);

  const collect = (cwd) => {
    const resolved = resolveCwd(cwd);
    return collectSkills(current(), {
      cwd: resolved.cwd,
      projectRoots: resolved.projectRoots,
      libraryOnly: true,
    });
  };

  const migrate = async (config) => {
    try {
      await migrateToLibrary(config);
    } catch (error) {
      logger.warn(error);
    }
  };

  const autoCommit = (config) => {
    if (config.autoSync !== true) return;
    try {
      gitCommit(config);
    } catch (error) {
      logger.warn(error);
    }
  };

  const handle = (method, needsWriteHeader, work) => async (request, response) => {
    if (!guard(request, response, method, needsWriteHeader)) return;
    try {
      await work(request, response);
    } catch (error) {
      const status = statusOf(error);
      if (status >= 500) logger.warn(error);
      writeJson(response, status, { error: messageOf(error) });
    }
  };

  return [
    {
      kind: 'exact',
      path: '/api/skill-hub/list',
      handler: handle('GET', false, async (request, response) => {
        const config = current();
        const resolved = resolveCwd(queryValue(request, 'cwd'));
        const collected = await collectAllSkills(config);
        writeJson(response, 200, {
          cwd: resolved.cwd,
          projectRoots: resolved.projectRoots,
          complete: collected.complete,
          count: collected.count,
          clients: collected.clients,
          skills: collected.skills,
          catalog: collected.catalog,
        });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/read',
      handler: handle('GET', false, async (request, response) => {
        const config = current();
        const collected = await collect(queryValue(request, 'cwd'));
        const selector = {
          name: queryValue(request, 'name'),
          path: queryValue(request, 'path'),
        };
        let detail;
        try {
          detail = await readSkill(config, collected, selector);
        } catch (error) {
          detail = await readTargetSkill(config, selector);
          if (detail === undefined) throw error;
        }
        writeJson(response, 200, detail);
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/favorite',
      handler: handle('POST', true, async (request, response) => {
        const body = await readJson(request);
        const config = current();
        await migrate(config);
        if (body.value === false) {
          const removed = removeCatalogEntry(config, body.name);
          if (config.autoSync === true) {
            try {
              gitCommit(config, { metadataOnly: true });
            } catch (error) {
              logger.warn(error);
            }
          }
          writeJson(response, 200, { ok: true, favorite: false, removed });
          return;
        }
        const collected = await collect(body.cwd);
        const manifest = readLibraryManifest(config);
        const meta = manifest.skills[body.name];
        if (meta?.kind === 'personal') {
          writeJson(response, 200, { ok: true, favorite: false, alreadyMine: true });
          return;
        }
        const entry =
          meta?.kind === 'collected'
            ? addCatalogEntry(config, {
                name: body.name,
                source: meta.source ?? { kind: 'unknown', reason: 'legacy collected entry has no source' },
                collectedFrom: meta.collectedFrom ?? null,
                addedAt: meta.addedAt,
              })
            : favoriteToCatalog(config, { name: body.name, clientId: body.clientId });
        autoCommit(config);
        writeJson(response, 200, { ok: true, favorite: true, catalog: true, ...entry });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/set-invocation',
      handler: handle('POST', true, async (request, response) => {
        const body = await readJson(request);
        const config = current();
        await migrate(config);
        const collected = await collect(body.cwd);
        const result = await setInvocation(config, collected, body);
        autoCommit(config);
        writeJson(response, 200, { ok: true, ...result });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/save',
      handler: handle('POST', true, async (request, response) => {
        const body = await readJson(request);
        const config = current();
        await migrate(config);
        const collected = await collect(body.cwd);
        const result = await saveSkillContent(config, collected, body);
        autoCommit(config);
        writeJson(response, 200, { ok: true, ...result });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/create',
      handler: handle('POST', true, async (request, response) => {
        const body = await readJson(request);
        const config = current();
        await migrate(config);
        const result = await createSkill(config, body);
        autoCommit(config);
        writeJson(response, 200, { ok: true, ...result });
      }),
    },

    {
      kind: 'exact',
      path: '/api/skill-hub/delete',
      handler: handle('POST', true, async (request, response) => {
        const body = await readJson(request);
        const config = current();
        await migrate(config);
        const collected = await collect(body.cwd);
        const result = await deleteSkill(config, collected, body);
        autoCommit(config);
        writeJson(response, 200, { ok: true, ...result });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/settings',
      handler: handle('POST', true, async (request, response) => {
        const body = await readJson(request);
        writeSettings(baseConfig, body);
        const config = current();
        let restore;
        if (body.restore === true) {
          restore = await restorePersonal(config);
        }
        writeJson(response, 200, {
          ok: true,
          status: syncStatus(config),
          warning: personalDirWarning(config),
          restore,
        });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/sync/status',
      handler: handle('GET', false, async (_request, response) => {
        const config = current();
        writeJson(response, 200, {
          ok: true,
          status: syncStatus(config),
          warning: personalDirWarning(config),
        });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/sync',
      handler: handle('POST', true, async (_request, response) => {
        const config = current();
        const result = await gitSync(config);
        writeJson(response, 200, {
          ok: true,
          result,
          status: syncStatus(config),
          warning: personalDirWarning(config),
        });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/restore',
      handler: handle('POST', true, async (_request, response) => {
        const config = current();
        const result = await restorePersonal(config);
        writeJson(response, 200, {
          ok: true,
          result,
          status: syncStatus(config),
          warning: personalDirWarning(config),
        });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/save-as-mine',
      handler: handle('POST', true, async (request, response) => {
        const body = await readJson(request);
        const config = current();
        await migrate(config);
        const result = await saveAsMine(config, body);
        autoCommit(config);
        writeJson(response, 200, { ok: true, ...result });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/distribute-skill',
      handler: handle('POST', true, async (request, response) => {
        const body = await readJson(request);
        const config = current();
        await migrate(config);
        const result = await distributeSkill(config, body);
        writeJson(response, 200, {
          ok: true,
          result,
          status: syncStatus(config),
          warning: personalDirWarning(config),
        });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/distribute',
      handler: handle('POST', true, async (request, response) => {
        const body = await readJson(request);
        const config = current();
        await migrateToLibrary(config);
        const result = await distribute(config, { replaceConflicts: body.replaceConflicts === true });
        writeJson(response, 200, {
          ok: true,
          result,
          status: syncStatus(config),
          warning: personalDirWarning(config),
        });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/targets',
      handler: handle('GET', false, async (_request, response) => {
        const config = current();
        await migrateToLibrary(config);
        const collected = await collectSkills(config, { libraryOnly: true, cwd: config.dshHome });
        const names = new Set(collected.skills.map((skill) => skill.name));
        const skills = collected.skills.map((skill) => ({
          name: skill.name,
          path: skill.path,
          targets: targetStates(config, skill),
        }));
        writeJson(response, 200, {
          ok: true,
          targets: config.targets,
          skills,
          discover: discoverTargetOnly(config, names),
          lastRestore: syncStatus(config).lastRestore,
          warning: personalDirWarning(config),
        });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/install-catalog',
      handler: handle('POST', true, async (request, response) => {
        const body = await readJson(request);
        const config = current();
        await migrate(config);
        const result = await installCatalog(config, {
          names: body.names,
          targetIds: body.targetIds,
          replaceConflicts: body.replaceConflicts === true,
        });
        writeJson(response, 200, { ok: true, result, status: syncStatus(config) });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/install-favorites',
      handler: handle('POST', true, async (request, response) => {
        const body = await readJson(request);
        const config = current();
        await migrateToLibrary(config);
        const result = await installCatalog(config, {
          names: body.names,
          targetIds: body.targetIds,
          replaceConflicts: body.replaceConflicts === true,
        });
        writeJson(response, 200, {
          ok: true,
          result,
          status: syncStatus(config),
          warning: personalDirWarning(config),
        });
      }),
    },
    {
      kind: 'exact',
      path: '/api/skill-hub/health',
      handler: handle('GET', false, async (_request, response) => {
        const collected = await collect();
        writeJson(response, 200, {
          ok: true,
          plugin: 'dsh-personal-skill-manager',
          skills: collected.count,
          complete: collected.complete,
        });
      }),
    },
  ];
}
