import { Button, Checkbox } from '@deepseek-ai/dsh-client-ui-primitives';
import * as React from 'react';
import { request } from '../api';
import { IconStar, IconRefresh, ClientMark } from '../components/Icons';

interface PluginRecord {
  id: string;
  name: string;
  client: string;
  pluginId: string;
  favoriteKey: string;
  favorite: boolean;
  installation: string;
  files: string;
  description?: string;
  evidence?: string;
  path?: string;
  projectPath?: string;
  scope?: string;
  version?: string;
}

export function pluginInstallPrompt(plugin, target, t) {
  const names = { cursor: 'Cursor', claude: 'Claude Code', codex: 'Codex', dsh: 'DSH' };
  const reference = JSON.stringify({
    name: plugin.name,
    identifier: plugin.pluginId,
    version: plugin.version ?? 'unknown',
    sourceClient: names[plugin.client] ?? plugin.client,
    localPath: plugin.path ?? null,
  });
  return t('delivery.prompt', { plugin: reference, target: names[target] ?? target });
}

export function PluginDistribution({ plugin, t }) {
  const [target, setTarget] = React.useState(plugin.client === 'cursor' ? 'claude' : 'cursor');
  const [prompt, setPrompt] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState('');
  return (
    <section className="skh-plugin-delivery" aria-label={t('delivery.title')}>
      <h4>{t('delivery.title')}</h4>
      <p className="skh-note">{t('delivery.help')}</p>
      <div className="skh-plugin-actions">
        <select
          className="skh-input"
          aria-label={t('delivery.target')}
          value={target}
          onChange={(e) => {
            setTarget(e.target.value);
            setPrompt('');
            setCopied(false);
            setError('');
          }}
        >
          {[
            ['cursor', 'Cursor'],
            ['claude', 'Claude Code'],
            ['codex', 'Codex'],
            ['dsh', 'DSH'],
          ].map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <Button
          size="sm" variant="outline"
          onClick={() => {
            setPrompt(pluginInstallPrompt(plugin, target, t));
            setCopied(false);
            setError('');
          }}
        >
          {t('delivery.generate')}
        </Button>
      </div>
      {prompt ? (
        <div className="skh-plugin-preview">
          <textarea
            className="skh-input"
            rows={5}
            readOnly={true}
            value={prompt}
            aria-label={t('delivery.generated')}
            style={{
              width: '100%',
              resize: 'vertical',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              font: 'inherit',
              fontSize: 12,
            }}
          />
          <Button
            size="sm" variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(prompt);
                setCopied(true);
                setError('');
              } catch {
                setError(t('delivery.copyFailed'));
              }
            }}
          >
            {t(copied ? 'delivery.copied' : 'delivery.copy')}
          </Button>
          {copied ? (
            <span role="status" className="skh-note">
              {t('delivery.copied')}
            </span>
          ) : null}
        </div>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}

export function PluginsPanel({ t, query, clientFilter }) {
  const [inventory, setInventory] = React.useState<{ plugins: PluginRecord[]; warnings: string[] }>();
  const [error, setError] = React.useState('');
  const [revision, setRevision] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const toggleFavorite = async (plugin) => {
    setSaving(true);
    setError('');
    try {
      await request('/plugins/favorite', {
        method: 'POST',
        body: { key: plugin.favoriteKey, favorite: !plugin.favorite },
      });
      setRevision((n) => n + 1);
    } catch (e) {
      setError(String(e.message));
    } finally {
      setSaving(false);
    }
  };
  React.useEffect(() => {
    let current = true;
    setError('');
    setLoading(true);
    request('/plugins')
      .then((value) => {
        if (current) setInventory(value);
      })
      .catch((e) => {
        if (current) setError(String(e.message));
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [revision]);
  const rows = (inventory?.plugins ?? []).filter(
    (p) =>
      (!favoritesOnly || p.favorite) &&
      (clientFilter === 'all' || clientFilter === p.client) &&
      [p.name, p.description, p.pluginId, p.version, p.path, p.scope, p.projectPath].some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
  );
  const clientNames = { claude: 'Claude Code', cursor: 'Cursor', codex: 'Codex', dsh: 'DSH' };
  const field = (label, value) =>
    value ? (
      <div className="skh-plugin-field">
        <dt>{label}</dt>
        <dd>
          <code>{value}</code>
        </dd>
      </div>
    ) : null;
  return (
    <section className="skh-plugins" aria-label={t('plugins.title')} aria-busy={loading}>
      <div className="skh-plugins-head">
        <div>
          <div className="skh-plugins-heading">
            <h2>{t('plugins.title')}</h2>
            {inventory ? (
              <span className="skh-plugins-count" role="status">
                {t('plugins.count', { count: rows.length })}
              </span>
            ) : null}
          </div>
          <p>{t('plugins.summary')}</p>
          <p>{t('plugins.favoriteHelp')}</p>
        </div>
        <Button
          size="sm" variant="outline"
          disabled={loading}
          title={t('plugins.refresh')}
          aria-label={t('plugins.refresh')}
          onClick={() => setRevision((n) => n + 1)}
        >
          <IconRefresh />
        </Button>
      </div>
      <Checkbox checked={favoritesOnly} onChange={setFavoritesOnly} label={t('plugins.favoritesOnly')} />
      {error ? (
        <p className="skh-status skh-status-error" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="skh-note" role="status">
          {t('plugins.loading')}
        </p>
      ) : null}
      {inventory?.warnings.length ? (
        <p className="skh-status skh-status-warn" role="status">
          {t('plugins.warnings')}
        </p>
      ) : null}
      {inventory && rows.length === 0 && !loading ? (
        <div className="skh-plugin-empty">{t('plugins.empty')}</div>
      ) : null}
      {rows.length ? (
        <div className="skh-plugin-columns" aria-hidden={true}>
          <span>{t('plugins.title')}</span>
          <span>{t('plugins.client')}</span>
          <span>{t('plugins.state')}</span>
          <span />
        </div>
      ) : null}
      <div className="skh-plugin-list">
        {rows.map((p) => (
          <div key={p.id} className="skh-plugin-item">
            <button
              className="skh-icon-btn skh-plugin-star"
              disabled={saving || loading}
              title={t(p.favorite ? 'detail.unfavorite' : 'detail.favorite')}
              aria-label={t(p.favorite ? 'detail.unfavorite' : 'detail.favorite') + ' ' + p.name}
              aria-pressed={p.favorite === true}
              onClick={() => toggleFavorite(p)}
            >
              <IconStar filled={p.favorite} />
            </button>
            <details className="skh-plugin-row">
              <summary className="skh-plugin-summary" title={t('plugins.details')}>
                <div className="skh-plugin-name">
                  <ClientMark id={p.client} />
                  <div className="skh-plugin-label">
                    <strong>{p.name}</strong>
                    <span className="skh-plugin-version" title={p.version ?? t('plugins.version')}>
                      {p.version ?? t('plugins.version')}
                    </span>
                  </div>
                </div>
                <span className="skh-plugin-client">{clientNames[p.client] ?? p.client}</span>
                <div className="skh-plugin-states">
                  <span
                    className={'skh-plugin-state ' + (p.installation === 'recorded' ? 'is-recorded' : '')}
                  >
                    {t('plugins.' + p.installation)}
                  </span>
                  {p.files === 'missing' ? (
                    <span className="skh-plugin-state is-missing">{t('plugins.missing')}</span>
                  ) : null}
                </div>
                <span className="skh-plugin-chevron" aria-hidden={true}>
                  {'›'}
                </span>
              </summary>
              <div className="skh-plugin-expanded">
                {p.description ? <p className="skh-plugin-description">{p.description}</p> : null}
                <dl>
                  {field(t('plugins.identity'), p.pluginId)}
                  {field(t('plugins.location'), p.path)}
                  {field(t('plugins.project'), p.projectPath)}
                  {field(t('plugins.evidence'), p.evidence)}
                </dl>
                <div className="skh-plugin-footnote">
                  {p.scope ? p.scope + ' · ' : ''}
                  {t('plugins.unknown')}
                </div>
                <PluginDistribution plugin={p} t={t} />
              </div>
            </details>
          </div>
        ))}
      </div>
    </section>
  );
}
