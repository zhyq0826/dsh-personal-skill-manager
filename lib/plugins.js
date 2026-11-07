import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';

function readJson(file, warnings) {
  try {
    if (fs.statSync(file).size > 2 * 1024 * 1024) throw Error('file too large');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') warnings.push({ path: file, reason: 'unreadable-record' });
    return undefined;
  }
}
function directories(root, warnings) {
  try { return fs.readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name); }
  catch (error) { if (error.code !== 'ENOENT') warnings.push({ path: root, reason: 'unreadable-directory' }); return []; }
}
function present(file) { try { return fs.statSync(file).isDirectory(); } catch { return false; } }
function text(value) { return typeof value === 'string' ? value : undefined; }

// Cache manifests establish presence on disk, never installation or activation.
export function scanPlugins(config, { home = os.homedir() } = {}) {
  const plugins = [], warnings = [];
  const add = row => plugins.push({ ...row, id: JSON.stringify([row.client, row.pluginId, row.path, row.scope]), loaded: 'unknown' });
  for (const client of ['claude', 'cursor', 'codex']) {
    const base = path.join(home, '.' + client, 'plugins');
    const installed = readJson(path.join(base, 'installed_plugins.json'), warnings);
    const recorded = new Set();
    if (installed?.plugins && typeof installed.plugins === 'object') {
      for (const [pluginId, values] of Object.entries(installed.plugins)) {
        if (!Array.isArray(values)) { warnings.push({ path: base, reason: 'unsupported-install-record' }); continue; }
        for (const record of values) {
          if (!record || typeof record !== 'object') continue;
          const installPath = text(record.installPath);
          if (installPath) recorded.add(path.resolve(installPath));
          add({ client, pluginId, name: pluginId.split('@')[0], version: text(record.version), path: installPath,
            scope: text(record.scope), projectPath: text(record.projectPath), installation: 'recorded',
            files: installPath ? (present(installPath) ? 'present' : 'missing') : 'unknown',
            enabled: 'unknown', evidence: path.join(base, 'installed_plugins.json') });
        }
      }
    }
    const candidates = [];
    for (const market of directories(path.join(base, 'cache'), warnings)) {
      for (const name of directories(path.join(base, 'cache', market), warnings)) {
        for (const version of directories(path.join(base, 'cache', market, name), warnings)) {
          candidates.push({ directory: path.join(base, 'cache', market, name, version), pluginId: name + '@' + market, installation: 'cache-only' });
        }
      }
    }
    for (const name of directories(path.join(base, 'local'), warnings)) {
      candidates.push({ directory: path.join(base, 'local', name), pluginId: name, installation: 'local-directory' });
    }
    for (const candidate of candidates) {
      if (recorded.has(path.resolve(candidate.directory))) continue;
      let manifest, evidence;
      for (const file of ['.cursor-plugin/plugin.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json', 'plugin.json']) {
        const p = path.join(candidate.directory, file);
        const data = readJson(p, warnings);
        if (data && typeof data.name === 'string') { manifest = data; evidence = p; break; }
      }
      if (!manifest) continue;
      add({ client, pluginId: candidate.pluginId, name: manifest.name, version: text(manifest.version),
        description: text(manifest.description), path: candidate.directory, installation: candidate.installation,
        files: 'present', enabled: 'unknown', evidence });
    }
  }
  const profiles = path.join(config.dshHome, 'profiles');
  for (const profile of directories(profiles, warnings)) {
    const base = path.join(profiles, profile), evidence = path.join(base, 'package.json');
    const pkg = readJson(evidence, warnings);
    for (const [name] of Object.entries(pkg?.dependencies ?? {})) {
      if (!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(name)) continue;
      const directory = path.join(base, 'node_modules', name);
      const installed = readJson(path.join(directory, 'package.json'), warnings);
      if (!installed?.dsh) continue;
      add({ client: 'dsh', pluginId: name, name: installed.name ?? name, version: text(installed.version),
        scope: profile, path: directory, installation: 'recorded', files: 'present', enabled: 'unknown', evidence });
    }
  }
  const favorites = readPluginFavorites(config);
  const observed = new Set();
  for (const plugin of plugins) {
    plugin.favoriteKey = pluginFavoriteKey(plugin);
    observed.add(plugin.favoriteKey);
    plugin.favorite = favorites.entries.some(f => f.key === plugin.favoriteKey);
  }
  for (const favorite of favorites.entries) {
    if (!observed.has(favorite.key)) plugins.push({ ...favorite, id: 'favorite:' + favorite.key, favoriteKey: favorite.key,
      favorite: true, installation: 'not-observed', files: 'unknown', enabled: 'unknown', loaded: 'unknown' });
  }
  return { plugins: plugins.sort((a, b) => a.client.localeCompare(b.client) || a.name.localeCompare(b.name)), warnings,
    coverage: ['claude', 'cursor', 'codex', 'dsh'], activationVerified: false };
}

function pluginFavoriteKey(plugin) {
  const version = plugin.version && plugin.version !== 'unknown' ? plugin.version : null;
  const identity = [plugin.client, plugin.pluginId, version, version ? null : plugin.path];
  return createHash('sha256').update(JSON.stringify(identity)).digest('hex');
}
export function readPluginFavorites(config) {
  if (!config.personalDir) return { version: 1, entries: [] };
  const file = path.join(config.personalDir, '.skill-hub', 'plugins.json');
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (parsed.version !== 1 || !Array.isArray(parsed.entries) || parsed.entries.some(e =>
      !e || typeof e.key !== 'string' || !/^[a-f0-9]{64}$/.test(e.key) ||
      typeof e.client !== 'string' || typeof e.pluginId !== 'string' || typeof e.name !== 'string')) {
      throw Error('Invalid plugin favorites format');
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') return { version: 1, entries: [] };
    throw Error('Plugin favorites could not be read; existing data was preserved');
  }
}
export function setPluginFavorite(config, key, favorite, options = {}) {
  if (typeof key !== 'string' || !/^[a-f0-9]{64}$/.test(key) || typeof favorite !== 'boolean') throw Error('Invalid plugin favorite request');
  const catalog = readPluginFavorites(config);
  const existing = catalog.entries.find(e => e.key === key);
  if (favorite && !existing) {
    const plugin = scanPlugins(config, options).plugins.find(p => p.favoriteKey === key);
    if (!plugin) throw Error('Plugin observation expired; refresh the list');
    catalog.entries.push({ key, client: plugin.client, pluginId: plugin.pluginId, name: plugin.name,
      version: plugin.version, source: { kind: 'client-record', pluginId: plugin.pluginId, evidence: plugin.installation },
      savedAt: new Date().toISOString() });
  }
  if (!favorite) catalog.entries = catalog.entries.filter(e => e.key !== key);
  const file = path.join(config.personalDir, '.skill-hub', 'plugins.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + '.' + randomUUID() + '.tmp';
  try { fs.writeFileSync(temporary, JSON.stringify(catalog, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); fs.renameSync(temporary, file); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  return { key, favorite };
}
