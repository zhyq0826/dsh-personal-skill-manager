/**
 * Skill library bundle entry.
 *
 * The Host half owns the scan, mutation, and HTTP surfaces. The browser half in
 * ./client.js renders the library as a main panel and sidebar entry.
 */

import { createRoutes } from './lib/routes.js';
import { effectiveConfig, resolveConfig } from './lib/core.js';
import { registerTool } from './lib/tool.js';
import { distribute, migrateToLibrary } from './lib/targets.js';
import { gitCommit } from './lib/sync.js';

export const name = 'skill-hub';

export const inject = ['webServer', 'tools', 'sessions', 'workingDirectory'];

/**
 * Mount the library routes and the model-facing tool.
 * @param ctx Host plugin context.
 * @param config Bundle row configuration.
 */
export function apply(ctx, config = {}) {
  const resolved = resolveConfig(config);
  ctx.effect(() => {
    const disposers = createRoutes(ctx, resolved).map((route) => ctx.webServer.register(route));
    return () => {
      for (const dispose of disposers.splice(0)) dispose();
    };
  }, 'skill-hub: routes');
  ctx.effect(() => registerTool(ctx, resolved), 'skill-hub: tool');
  ctx.effect(() => {
    const config = effectiveConfig(resolved);
    const timer = setTimeout(async () => {
      try {
        await migrateToLibrary(config);
        if (config.autoSync === true) {
          gitCommit(config);
        }
        if (config.autoDistribute === true) {
          await distribute(config, { replaceConflicts: false });
        }
      } catch (error) {
        if (typeof ctx.logger?.warn === 'function') ctx.logger.warn(error);
        else console.warn('[skill-hub] startup distribution failed', error);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, 'skill-hub: startup favorite install');
}
