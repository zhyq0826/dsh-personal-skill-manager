import { Button, Checkbox, Input, SegmentedTabs } from '@deepseek-ai/dsh-client-ui-primitives';
import * as React from 'react';
import { messageOf, request } from '../api';
import { LocalClients } from './LocalClients';
import { Badge } from '../components/Controls';
import { distributionNotice } from './distribution';

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
  const panelId = React.useId();
  const [view, setView] = React.useState('libraryView');
  const [status, setStatus] = React.useState(undefined);
  const [form, setForm] = React.useState(undefined);
  const [busy, setBusy] = React.useState(false);
  const [distributionFeedback, setDistributionFeedback] = React.useState(false);
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
    setDistributionFeedback(path === '/distribute');
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
      } else if (path === '/distribute') {
        const message = distributionNotice(result, form.targets, t);
        if (result.failed || result.conflicts) setError(message);
        else setNotice(message);
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
    return <div className="skh-empty-detail"><Button type="button" size="sm" variant="outline" onClick={onBack}>{t('sync.back')}</Button><p role="status">{error || t('sync.loading')}</p></div>;
  }

  const set = (field) => (event) => {
    const value = event.target.value;
    setForm((previous) => ({ ...previous, [field]: value }));
  };
  const setTarget = (index, field) => (value) => {
    setForm((previous) => ({
      ...previous,
      targets: previous.targets.map((target, cursor) =>
        cursor === index ? { ...target, [field]: value } : target,
      ),
    }));
  };
  const unsaved = JSON.stringify(form) !== JSON.stringify(syncFormFrom(status));
  const remote = status.settings.gitRemote || '';
  const hasRemote = Boolean(remote);
  const repoName = remote.split(/[/:\\]/).filter(Boolean).pop()?.replace(/\.git$/, '') || remote;
  const repo = status.repo;
  const favorites = status.manifest.favorites;
  const summary = last ?? (view === 'clientsView' ? status.lastRestore : undefined);
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

  const feedback = error !== '' ? (
        <div className="skh-status skh-status-error" role="alert">
          {error}
        </div>
      ) : notice !== '' ? (
        <div className="skh-status skh-status-notice" role="status">
          {notice}
        </div>
      ) : null;
  const results = summary !== undefined && summary !== null ? (
          <details className="skh-sync-card">
            <summary>
              {summary.at === undefined
                ? t('sync.operationDetails')
                : `${t('sync.lastRestore')}: ${whenText(summary.at)}`}
            </summary>
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
          </details>
        ) : null;
  const saveSettings = (
    <div className="skh-actions">
      <Button type="button" size="sm" variant="outline" disabled={busy || !unsaved}
        onClick={() => run('/settings', { ...form, restore: false }, 'sync.saved')}>{t('sync.save')}</Button>
      {unsaved && <Button type="button" size="sm" variant="outline" disabled={busy}
        onClick={() => setForm(syncFormFrom(status))}>{t('sync.cancelSettings')}</Button>}
    </div>
  );
  const canLeave = () => !unsaved || window.confirm(t('sync.discardOnLeave'));
  const switchView = (next) => {
    if (next === view || !canLeave()) return;
    if (unsaved) setForm(syncFormFrom(status));
    setView(next);
    setDistributionFeedback(false);
    setNotice('');
    setError('');
    setLast(undefined);
  };

  return (
    <div className="skh-sync">
      <header className="skh-sync-heading">
        <h1>{t('panel.sync')}</h1>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => { if (canLeave()) onBack(); }}>{t('sync.back')}</Button>
      </header>
      <fieldset className="skh-sync-tabs" disabled={busy}>
        <SegmentedTabs label={t('panel.sync')} value={view} onChange={switchView}
          items={['libraryView', 'clientsView', 'recovery'].map(value => ({ value, id: `${panelId}-${value}`, panelId, label: t(`sync.${value}`) }))} />
      </fieldset>
      <div role="tabpanel" id={panelId} aria-labelledby={`${panelId}-${view}`}>
      {unsaved && <div className="skh-note">{t('sync.unsaved')}</div>}
      {view !== 'libraryView' && !distributionFeedback && feedback}
      {view === 'libraryView' && <>
        <section className="skh-sync-overview">
          <div>
            <h2>{t('sync.repo')}</h2>
            <p className="skh-repo-location">{hasRemote ? `${repoName} · ${status.settings.gitBranch}` : t('sync.setupHint')}</p>
            {repo.isRepo && <Badge tone={repo.dirty ? 'warn' : 'muted'}>{t(repo.dirty ? 'sync.repoDirty' : 'sync.repoClean')}</Badge>}
          </div>
          <Button type="button" size="sm" variant={hasRemote ? 'primary' : 'outline'} disabled={busy || unsaved}
            onClick={() => run('/sync', {}, hasRemote ? 'sync.synced' : 'sync.localDone')}>
            {t(hasRemote ? 'sync.syncNow' : 'sync.localCommit')}
          </Button>
        </section>
        {feedback}
        {results}
        <details className="skh-sync-card" key="git-settings" open={!hasRemote || undefined}>
          <summary>{t('sync.gitSettings')}</summary>
        <div className="skh-sync-title">{t('sync.personalDir')}</div>
        <Input
          className="skh-text-field"
          aria-label={t('sync.personalDir')}
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
        <Input
          className="skh-text-field"
          aria-label={t('sync.gitRemote')}
          value={form.gitRemote}
          placeholder="git@github.com:you/skills.git"
          onChange={set('gitRemote')}
          disabled={busy}
          spellCheck={false}
        />
        <div className="skh-help">{t('sync.gitRemoteHint')}</div>
        <div className="skh-sync-line">
          <span className="skh-sync-title">{t('sync.branch')}</span>
          <Input
            className="skh-branch"
            aria-label={t('sync.branch')}
            value={form.gitBranch}
            onChange={set('gitBranch')}
            disabled={busy}
            spellCheck={false}
          />
        </div>
        <Checkbox checked={form.autoSync} onChange={autoSync => setForm(previous => ({ ...previous, autoSync }))} disabled={busy} label={t('sync.autoSync')} />
        {!repo.isRepo && <p className="skh-help">{t('sync.firstSyncHint')}</p>}
        {saveSettings}
        </details>
        <details className="skh-sync-card">
          <summary>{t('sync.libraryContents')} · {status.manifest.count}</summary>
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
        </details>
      </>}
      {view === 'clientsView' && <LocalClients
        distributionFeedback={distributionFeedback && (busy ? <p role="status">{t('distribution.pending')}</p> : feedback)}
        t={t} data={targetsData} form={form} savedTargets={status.settings.targets ?? status.targets ?? []} personalMeta={favorites} busy={busy} unsaved={unsaved}
        setTarget={setTarget} setAuto={autoDistribute => setForm(previous => ({ ...previous, autoDistribute }))}
        save={() => run('/settings', { ...form, restore: false }, 'sync.saved')}
        revert={() => setForm(syncFormFrom(status))}
        distribute={(replaceConflicts) => run('/distribute', { replaceConflicts }, 'sync.distributed')}
        favorite={(item) => run('/favorite', { name: item.name, clientId: item.targets[0]?.targetId, value: true }, 'notice.favorited')}
      />}
      {view === 'recovery' && <>
      <div className="skh-sync-card">
        <div className="skh-section-title">{t('sync.recovery')}</div>
        <p>{t('sync.recoveryHint')}</p>
        {!hasRemote && <Button type="button" size="sm" variant="outline" onClick={() => switchView('libraryView')}>{t('sync.gitSettings')}</Button>}
        <div className="skh-actions">
          <Button type="button" size="sm" variant="outline" disabled={busy || unsaved || !hasRemote}
            onClick={() => run('/restore', {}, 'sync.restored')}>
            {t('sync.restore')}
          </Button>
        </div>
        <div className="skh-sync-title">{`${t('sync.catalog')} · ${status.catalog?.count ?? 0} · ${t('sync.installable')} ${status.catalog?.installable ?? 0}`}</div>
        <div className="skh-help">{t('sync.catalogHelp')}</div>
        {(status.catalog?.entries ?? []).slice(0, 50).map((entry) => (
          <div className="skh-sync-favorite" key={entry.name}>
            <span className="skh-name">{entry.name}</span>
            <span className="skh-help">{entry.sourceKind}</span>
          </div>
        ))}
        <div className="skh-actions">
          <Button
            type="button"
            size="sm" variant="outline"
            disabled={busy}
            onClick={() => run('/install-catalog', {}, 'sync.catalogInstalled')}
          >
            {t('sync.installCatalog')}
          </Button>
        </div>
      </div>
      {status.legacyCollected > 0 ? (
        <div className="skh-sync-card">
          <div className="skh-sync-title">{`${t('sync.legacyTitle')} (${status.legacyCollected})`}</div>
          <div className="skh-help">{t('sync.legacyHelp')}</div>
          <div className="skh-actions">
            <Button
              type="button"
              size="sm" variant="outline"
              disabled={busy}
              onClick={() => run('/cleanup-legacy', {}, 'sync.legacyCleaned')}
            >
              {t('sync.cleanupLegacy')}
            </Button>
          </div>
        </div>
      ) : null}
      </>}
      {view !== 'libraryView' && results}
      </div>
    </div>
  );
}
