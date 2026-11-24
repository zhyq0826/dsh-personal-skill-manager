import * as React from 'react';
import { messageOf, request } from '../api';
import { Badge } from '../components/Controls';

function syncFormFrom(status) {
  return {
    personalDir: status?.settings?.personalDir ?? '',
    gitRemote: status?.settings?.gitRemote ?? '',
    gitBranch: status?.settings?.gitBranch ?? 'main',
    autoDistribute: status?.settings?.autoDistribute === true,
    autoSync: status?.settings?.autoSync ?? false,
    targets: (status?.settings?.targets ?? status?.targets ?? []).map((target) => ({ ...target })),
  };
}

function whenText(iso) {
  if (typeof iso !== 'string' || iso === '') return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function SyncPanel({ t, onBack, onChanged }) {
  const [status, setStatus] = React.useState(undefined);
  const [form, setForm] = React.useState(undefined);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [last, setLast] = React.useState(undefined);
  const [targetsData, setTargetsData] = React.useState(undefined);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setError('');
      try {
        const [payload, targetsPayload] = await Promise.all([
          request('/sync/status'),
          request('/targets').catch(() => undefined),
        ]);
        if (!active) return;
        setStatus(payload.status);
        setForm(syncFormFrom(payload.status));
        if (targetsPayload !== undefined) setTargetsData(targetsPayload);
      } catch (caught) {
        if (active) setError(t('sync.loadFailed', { error: messageOf(caught) }));
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [t]);

  const run = async (path, body, successKey) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = await request(path, { method: 'POST', body: body ?? {} });
      if (payload.status !== undefined) {
        setStatus(payload.status);
        setForm(syncFormFrom(payload.status));
      }
      let result = payload.result ?? payload.restore ?? payload.install;
      if (result !== undefined && result !== null && result.distribution !== undefined) {
        result = result.distribution;
      }
      if (
        result !== undefined &&
        result !== null &&
        result.favorites !== undefined &&
        typeof result.favorites.installed === 'number'
      ) {
        result = result.favorites;
      }
      setLast(result);
      if (result !== undefined && typeof result === 'object' && typeof result.error === 'string') {
        setError(t('sync.actionFailed', { error: result.error }));
      } else {
        setNotice(t(successKey));
      }
      const targetsPayload = await request('/targets').catch(() => undefined);
      if (targetsPayload !== undefined) setTargetsData(targetsPayload);
      onChanged?.();
      return payload;
    } catch (caught) {
      setError(t('sync.actionFailed', { error: messageOf(caught) }));
      return undefined;
    } finally {
      setBusy(false);
    }
  };

  if (status === undefined || form === undefined) {
    return <div className="skh-empty-detail">{error === '' ? t('sync.loading') : error}</div>;
  }

  const set = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((previous) => ({ ...previous, [field]: value }));
  };
  const setTarget = (index, field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((previous) => ({
      ...previous,
      targets: previous.targets.map((target, cursor) =>
        cursor === index ? { ...target, [field]: value } : target,
      ),
    }));
  };
  const stateLabel = (state) => t(`sync.state.${state}`);
  const repo = status.repo;
  const favorites = status.manifest.favorites;
  const summary = last ?? status.lastRestore;
  const summaryResults = Array.isArray(summary?.results) ? summary.results : [];
  const summaryIsCounts = typeof summary?.installed === 'number';
  const summaryIsDistribution = typeof summary?.linked === 'number';

  const summaryLines = [];
  if (summaryIsDistribution) {
    summaryLines.push(
      `${t('sync.linked')}: ${summary.linked} · ${t('sync.copied')}: ${summary.copied} · ${t('sync.present')}: ${summary.present} · ${t('sync.conflict')}: ${summary.conflicts} · ${t('sync.failed')}: ${summary.failed}`,
    );
  } else if (summaryIsCounts) {
    summaryLines.push(
      `${t('sync.resultInstalled', { count: summary.installed })} · ${t('sync.resultPresent', {
        count: summary.present,
      })} · ${t('sync.resultFailed', { count: summary.failed })} · ${t('sync.resultNeedsSource', {
        count: summary.needsSource,
      })}`,
    );
  } else if (summary !== undefined && summary !== null) {
    if (summary.changed !== undefined) summaryLines.push(`${t('sync.changed')}: ${String(summary.changed)}`);
    if (summary.commit !== undefined)
      summaryLines.push(`${t('sync.commit')}: ${String(summary.commit ?? '—')}`);
    if (summary.pushed !== undefined) summaryLines.push(`${t('sync.pushed')}: ${String(summary.pushed)}`);
    if (summary.reason !== undefined) summaryLines.push(`${t('sync.reason')}: ${String(summary.reason)}`);
  }

  return (
    <div className="skh-sync">
      <div className="skh-detail-head">
        <div className="skh-detail-title">{t('sync.title')}</div>
        <button type="button" className="skh-btn" onClick={onBack} disabled={busy}>
          {t('sync.back')}
        </button>
      </div>
      {t('sync.help') === '' ? null : <p className="skh-note">{t('sync.help')}</p>}
      {error !== '' ? (
        <div className="skh-status skh-status-error" role="alert">
          {error}
        </div>
      ) : notice !== '' ? (
        <div className="skh-status skh-status-notice" role="status">
          {notice}
        </div>
      ) : null}
      <div className="skh-sync-card">
        <div className="skh-sync-title">{t('sync.personalDir')}</div>
        <input
          className="skh-input"
          value={form.personalDir}
          placeholder={status.personalDir}
          onChange={set('personalDir')}
          disabled={busy}
          spellCheck={false}
        />
        {t('sync.personalDirHint') === '' ? null : (
          <div className="skh-help">{t('sync.personalDirHint')}</div>
        )}
        <div className="skh-sync-title" style={{ marginTop: 12 }}>
          {t('sync.gitRemote')}
        </div>
        <input
          className="skh-input"
          value={form.gitRemote}
          placeholder="git@github.com:you/skills.git"
          onChange={set('gitRemote')}
          disabled={busy}
          spellCheck={false}
        />
        <div className="skh-help">{t('sync.gitRemoteHint')}</div>
        <div className="skh-sync-line">
          <span className="skh-sync-title">{t('sync.branch')}</span>
          <input
            className="skh-input skh-branch"
            value={form.gitBranch}
            onChange={set('gitBranch')}
            disabled={busy}
            spellCheck={false}
          />
        </div>
        <label className="skh-check">
          <input
            type="checkbox"
            checked={form.autoDistribute}
            onChange={set('autoDistribute')}
            disabled={busy}
          />
          <span>{t('sync.autoDistribute')}</span>
        </label>
        <label className="skh-check">
          <input type="checkbox" checked={form.autoSync} onChange={set('autoSync')} disabled={busy} />
          <span>{t('sync.autoSync')}</span>
        </label>
        <div className="skh-actions">
          <button
            type="button"
            className="skh-btn skh-btn-primary"
            disabled={busy}
            onClick={() => run('/settings', { ...form, restore: true }, 'sync.restored')}
          >
            {busy ? <span className="skh-spin" /> : null}
            {t('sync.saveRestore')}
          </button>
          <button
            type="button"
            className="skh-btn"
            disabled={busy}
            onClick={() => run('/settings', { ...form, restore: false }, 'sync.saved')}
          >
            {t('sync.save')}
          </button>
          <button
            type="button"
            className="skh-btn"
            disabled={busy}
            onClick={() => run('/sync', {}, 'sync.synced')}
          >
            {t('sync.syncNow')}
          </button>
          <button
            type="button"
            className="skh-btn"
            disabled={busy}
            onClick={() => run('/restore', {}, 'sync.restored')}
          >
            {t('sync.restore')}
          </button>
          <button
            type="button"
            className="skh-btn"
            disabled={busy}
            onClick={() => run('/distribute', {}, 'sync.distributed')}
          >
            {t('sync.distribute')}
          </button>
          <button
            type="button"
            className="skh-btn"
            disabled={busy}
            onClick={() => run('/distribute', { replaceConflicts: true }, 'sync.distributed')}
          >
            {t('sync.distributeReplace')}
          </button>
        </div>
      </div>
      <div className="skh-sync-card">
        <div className="skh-sync-title">{t('sync.repo')}</div>
        <div className="skh-sync-row">
          <Badge tone={repo.isRepo ? 'ok' : 'warn'}>
            {repo.isRepo ? t('sync.repoYes') : t('sync.repoNo')}
          </Badge>
          {repo.isRepo ? (
            <Badge tone={repo.dirty ? 'warn' : 'muted'}>
              {repo.dirty ? t('sync.repoDirty') : t('sync.repoClean')}
            </Badge>
          ) : null}
          <Badge>{t('sync.manifest') + ': ' + status.manifest.count}</Badge>
        </div>
        <div className="skh-help">{`${t('sync.remote')}: ${repo.remote || status.settings.gitRemote || t('sync.none')}`}</div>
        <div className="skh-help">{`${t('sync.personalDir')}: ${status.personalDir}`}</div>
        {repo.isRepo ? null : <div className="skh-help">{t('sync.firstSyncHint')}</div>}
      </div>
      <div className="skh-sync-card">
        <div className="skh-sync-title">{t('sync.targets')}</div>
        <div className="skh-help">{t('sync.targetsHelp')}</div>
        {form.targets.map((target, index) => (
          <div className="skh-target-row" key={target.id}>
            <label className="skh-check">
              <input
                type="checkbox"
                checked={target.enabled}
                onChange={setTarget(index, 'enabled')}
                disabled={busy}
              />
              <span className="skh-name">{target.label}</span>
            </label>
            <input
              className="skh-input"
              value={target.path}
              onChange={setTarget(index, 'path')}
              disabled={busy}
              spellCheck={false}
            />
            <select
              className="skh-select"
              value={target.mode}
              onChange={setTarget(index, 'mode')}
              disabled={busy}
            >
              <option value="link">{t('sync.modeLink')}</option>
              <option value="copy">{t('sync.modeCopy')}</option>
            </select>
          </div>
        ))}
        {targetsData !== undefined && targetsData.skills.length > 0 ? (
          <div className="skh-sync-results">
            <div className="skh-section-title">{t('detail.targets')}</div>
            {targetsData.skills.slice(0, 50).map((row) => (
              <div className="skh-sync-result-row" key={row.name}>
                <span className="skh-name">{row.name}</span>
                <span className="skh-help">
                  {row.targets.map((target) => `${target.label}: ${stateLabel(target.state)}`).join(' · ')}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        {targetsData !== undefined && targetsData.discover.length > 0 ? (
          <div className="skh-sync-result">
            <div className="skh-section-title">{`${t('sync.targetOnly')} (${targetsData.discover.length})`}</div>
            {t('sync.targetOnlyHelp') === '' ? null : (
              <div className="skh-help">{t('sync.targetOnlyHelp')}</div>
            )}
            {targetsData.discover.slice(0, 50).map((item) => (
              <div className="skh-sync-favorite" key={item.name}>
                <span className="skh-name">{item.name}</span>
                <span className="skh-help">
                  {item.targets.map((target) => target.targetLabel).join(' · ')}
                </span>
                <button
                  type="button"
                  className="skh-btn"
                  disabled={busy}
                  onClick={() =>
                    run(
                      '/favorite',
                      { name: item.name, clientId: item.targets[0]?.targetId, value: true },
                      'notice.favorited',
                    )
                  }
                >
                  {t('sync.collect')}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {status.legacyCollected > 0 ? (
        <div className="skh-sync-card">
          <div className="skh-sync-title">{`${t('sync.legacyTitle')} (${status.legacyCollected})`}</div>
          <div className="skh-help">{t('sync.legacyHelp')}</div>
          <div className="skh-actions">
            <button
              type="button"
              className="skh-btn"
              disabled={busy}
              onClick={() => run('/cleanup-legacy', {}, 'sync.legacyCleaned')}
            >
              {t('sync.cleanupLegacy')}
            </button>
          </div>
        </div>
      ) : null}
      <div className="skh-sync-card">
        <div className="skh-sync-title">{`${t('sync.catalog')} · ${status.catalog?.count ?? 0} · ${t('sync.installable')} ${status.catalog?.installable ?? 0}`}</div>
        <div className="skh-help">{t('sync.catalogHelp')}</div>
        {(status.catalog?.entries ?? []).slice(0, 50).map((entry) => (
          <div className="skh-sync-favorite" key={entry.name}>
            <span className="skh-name">{entry.name}</span>
            <span className="skh-help">{entry.sourceKind}</span>
          </div>
        ))}
        <div className="skh-actions">
          <button
            type="button"
            className="skh-btn"
            disabled={busy}
            onClick={() => run('/install-catalog', {}, 'sync.catalogInstalled')}
          >
            {t('sync.installCatalog')}
          </button>
        </div>
      </div>
      <div className="skh-sync-card">
        <div className="skh-sync-title">{`${t('sync.manifest')} · ${t('sync.favorites')} ${status.manifest.count} · ${t('sync.installable')} ${status.manifest.installable}`}</div>
        {favorites.length === 0 ? (
          <div className="skh-help">{t('sync.noFavorites')}</div>
        ) : (
          <div className="skh-sync-favorites">
            {favorites.map((favorite) => (
              <div className="skh-sync-favorite" key={favorite.name}>
                <span className="skh-name">{favorite.name}</span>
                <span className="skh-help">
                  {favorite.missing === true
                    ? t('sync.missing')
                    : favorite.kind === 'personal'
                      ? t('sync.kindPersonal')
                      : t('sync.kindCollected')}
                </span>
                <Badge tone={favorite.installable ? 'ok' : 'warn'}>
                  {favorite.installable ? t('sync.installableYes') : t('sync.installableNo')}
                </Badge>
                {favorite.reason ? <span className="skh-help">{favorite.reason}</span> : null}
              </div>
            ))}
          </div>
        )}
        {summary !== undefined && summary !== null ? (
          <div className="skh-sync-result">
            <div className="skh-section-title">
              {summary.at === undefined
                ? t('sync.resultsTitle')
                : `${t('sync.lastRestore')}: ${whenText(summary.at)}`}
            </div>
            {summaryLines.map((line, index) => (
              <div className="skh-help" key={`line-${index}`}>
                {line}
              </div>
            ))}
            {summaryResults.length === 0 ? null : (
              <div className="skh-sync-results">
                <div className="skh-help">{t('sync.resultsTitle')}</div>
                {summaryResults.slice(0, 20).map((result, index) => (
                  <div className="skh-sync-result-row" key={`${result.name}-${index}`}>
                    <span className="skh-name">{result.name}</span>
                    <span className="skh-help">{result.state}</span>
                    {result.error ? <span className="skh-help">{result.error}</span> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
