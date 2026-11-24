import * as React from 'react';
import { messageOf, request } from '../api';
import { identity, isWrittenSkill, isCommunitySkill } from './model';
import { IconRefresh, IconPlus, ClientMark, IconSync } from '../components/Icons';
import { useSkillLibrary } from './useSkillLibrary';
import { Row } from './SkillRow';
import { CreateForm } from './CreateSkill';
import { SyncPanel } from '../sync/SyncPage';
import { distributionNotice } from '../sync/distribution';
import { Detail } from './SkillDetail';
import { PluginsPanel } from '../plugins/PluginsPage';
import css from '../styles.css';
import { version as VERSION } from '../../../package.json';

export function Panel({ t }) {
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [clientFilter, setClientFilter] = React.useState('all');
  const [clientMenuOpen, setClientMenuOpen] = React.useState(false);
  const [mode, setMode] = React.useState('browse');
  const [busy, setBusy] = React.useState(false);

  const {
    data,
    loading,
    allSkills,
    selected,
    selectedKey,
    setSelectedKey,
    detail,
    detailLoading,
    draft,
    setDraft,
    load,
    refresh,
  } = useSkillLibrary(mode, t, setError);

  const run = React.useCallback(
    async (work, successMessage, selectPath) => {
      setBusy(true);
      setError('');
      setNotice('');
      try {
        const result = await work();
        setNotice(successMessage(result));
        await refresh(selectPath);
        return result;
      } catch (caught) {
        setError(t('error.generic', { error: messageOf(caught) }));
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [refresh, t],
  );

  const onSelect = (skill) => {
    setMode('browse');
    setSelectedKey(identity(skill));
  };

  const onFavorite = (skill) => {
    const clientId = (skill.clients ?? []).find((client) => client.id !== 'library')?.id;
    const value = isCommunitySkill(skill) ? false : true;
    run(
      () =>
        request('/favorite', {
          method: 'POST',
          body: { name: skill.name, clientId, value },
        }),
      () =>
        value ? t('notice.favorited', { name: skill.name }) : t('notice.unfavorited', { name: skill.name }),
      undefined,
    );
  };

  const onSaveAsMine = (skill) => {
    const clientId = (skill.clients ?? []).find((client) => client.id !== 'library')?.id;
    run(
      () =>
        request('/save-as-mine', {
          method: 'POST',
          body: { name: skill.name, clientId },
        }),
      () => t('notice.savedAsMine', { name: skill.name }),
      undefined,
    );
  };

  const onDistribute = (skill, targetId, replace) => {
    run(
      () =>
        request('/distribute-skill', {
          method: 'POST',
          body: { name: skill.name, targetIds: [targetId], replaceConflicts: replace === true },
        }),
      ({ result }) => distributionNotice(result, skill.targets, t),
      skill.path,
    );
  };

  const onToggleInvocation = (field) => {
    if (selected === undefined) return;
    const body = {
      name: selected.name,
      path: selected.path,
      cwd: data?.cwd,
      ...(field === 'model'
        ? { modelInvocable: !detail?.modelInvocable }
        : { userInvocable: !detail?.userInvocable }),
    };
    run(
      () => request('/set-invocation', { method: 'POST', body }),
      () => t('notice.invocation'),
      selected.path,
    );
  };

  const onSave = () => {
    if (selected === undefined || detail === undefined) return;
    run(
      () =>
        request('/save', {
          method: 'POST',
          body: {
            name: selected.name,
            path: selected.path,
            cwd: data?.cwd,
            content: draft,
            expectedDigest: detail.digest,
          },
        }),
      () => t('notice.saved'),
      selected.path,
    );
  };

  const onReset = () => {
    if (detail !== undefined) setDraft(detail.content);
  };

  const onCopy = async () => {
    if (detail === undefined) return;
    try {
      await navigator.clipboard.writeText(detail.path);
      setNotice(t('notice.copied'));
    } catch {
      setNotice(detail.path);
    }
  };

  const onDelete = () => {
    if (selected === undefined) return;
    if (!window.confirm(t('confirm.delete', { name: selected.name }))) return;
    run(
      () =>
        request('/delete', {
          method: 'POST',
          body: { name: selected.name, path: selected.path, cwd: data?.cwd, confirm: true },
        }),
      () => t('notice.deleted'),
      undefined,
    );
  };

  const onCreate = async (form) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await request('/create', {
        method: 'POST',
        body: { ...form, cwd: data?.cwd },
      });
      setNotice(t('notice.created', { name: result.name }));
      setMode('browse');
      await refresh(result.path);
    } catch (caught) {
      setError(t('error.create', { error: messageOf(caught) }));
    } finally {
      setBusy(false);
    }
  };

  const needle = query.trim().toLowerCase();
  const isWritten = isWrittenSkill;
  const isCollected = isCommunitySkill;
  const matchesFilter = (skill) => {
    if (filter === 'library' && !isWritten(skill) && !isCollected(skill)) return false;
    if (clientFilter !== 'all') return (skill.clientIds ?? []).includes(clientFilter);
    return true;
  };
  const filteredSkills =
    data === undefined
      ? []
      : allSkills.filter((skill) => {
          if (!matchesFilter(skill)) return false;
          if (needle === '') return true;
          return [
            skill.name,
            skill.description,
            skill.path ?? '',
            ...(skill.clients ?? []).map((client) => client.label ?? ''),
          ].some((value) => String(value).toLowerCase().includes(needle));
        });

  const stats = {
    total: allSkills.length,
    library: allSkills.filter((skill) => isWritten(skill) || isCollected(skill)).length,
    written: allSkills.filter(isWritten).length,
    collected: allSkills.filter(isCollected).length,
    clients: allSkills.filter((skill) => !isWritten(skill) && !isCollected(skill)).length,
    conflicts: allSkills.reduce(
      (sum, skill) => sum + (skill.targets ?? []).filter((target) => target.state === 'conflict').length,
      0,
    ),
  };

  let listContent;
  if (loading && data === undefined) {
    listContent = (
      <div className="skh-empty">
        <span className="skh-spin" /> {t('list.loading')}
      </div>
    );
  } else if (filteredSkills.length === 0) {
    listContent = <div className="skh-empty">{t('list.empty')}</div>;
  } else {
    listContent = (
      <section className="skh-group">
        <div className="skh-group-head">
          <span className="skh-group-title">
            {filter === 'library' ? t('panel.mySkills') : t('panel.allSkills')}
          </span>
          <span className="skh-group-count">{filteredSkills.length}</span>
        </div>
        {filteredSkills.map((skill) => (
          <Row
            key={identity(skill)}
            t={t}
            skill={skill}
            active={identity(skill) === selectedKey}
            busy={busy}
            onSelect={() => onSelect(skill)}
            onFavorite={() => onFavorite(skill)}
          />
        ))}
      </section>
    );
  }

  let detailContent;
  if (mode === 'create') {
    detailContent = <CreateForm t={t} busy={busy} onCreate={onCreate} onCancel={() => setMode('browse')} />;
  } else if (!filteredSkills.some((skill) => identity(skill) === selectedKey)) {
    detailContent = (
      <div className="skh-empty-detail">
        <p>{filteredSkills.length || !data ? t('detail.select') : t('detail.noResults')}</p>
        {selected && detail && draft !== detail.content ? <p>{t('detail.hiddenDraft', { name: selected.name })}</p> : null}
        {query !== '' ? <button type="button" className="skh-btn" onClick={() => setQuery('')}>{t('list.clearSearch')}</button> : null}
      </div>
    );
  } else {
    detailContent = (
      <Detail
        t={t}
        skill={selected}
        detail={detail}
        draft={draft}
        setDraft={setDraft}
        busy={busy}
        detailLoading={detailLoading}
        onSave={onSave}
        onReset={onReset}
        onFavorite={() => onFavorite(selected)}
        onSaveAsMine={() => onSaveAsMine(selected)}
        onDistribute={(targetId, replace) => onDistribute(selected, targetId, replace)}
        onCopy={onCopy}
        onDelete={onDelete}
        onToggleInvocation={onToggleInvocation}
      />
    );
  }

  const status =
    error !== '' ? (
      <div className="skh-status skh-status-error" role="alert">
        {error}
      </div>
    ) : notice !== '' ? (
      <div className="skh-status skh-status-notice" role="status">
        {notice}
      </div>
    ) : data?.complete === false ? (
      <div className="skh-status skh-status-warn" role="status">
        {t('panel.incomplete')}
      </div>
    ) : null;

  const clientChoices = [
    { id: 'all', label: t('panel.allClients') },
    ...(data?.clients ?? []).filter((client) => client.id !== 'library'),
  ];
  const selectedClient = clientChoices.find((client) => client.id === clientFilter) ?? clientChoices[0];

  if (mode === 'sync') {
    return <div className="skh-root"><style>{css}</style><main className="skh-sync-page">
      <SyncPanel t={t} onBack={() => setMode('browse')} onChanged={() => refresh()} />
    </main></div>;
  }

  return (
    <div className="skh-root">
      <style>{css}</style>
      <header className="skh-header">
        <div className="skh-heading">
          <div className="skh-title-row">
            <div className="skh-title">{t('panel.title')}</div>
            <span className="skh-version">{`v${VERSION}`}</span>
          </div>
          {t('panel.subtitle') === '' ? null : <div className="skh-subtitle">{t('panel.subtitle')}</div>}
        </div>
        <div className="skh-header-actions">
          <button type="button" className="skh-btn" onClick={() => load()} disabled={loading || busy}>
            <IconRefresh />
            {t('panel.refresh')}
          </button>
          <button
            type="button"
            className="skh-btn"
            onClick={() => {
              setMode('sync');
              setNotice('');
              setError('');
            }}
            disabled={busy}
          >
            <IconSync />
            {t('panel.sync')}
          </button>
          <button
            type="button"
            className="skh-btn skh-btn-primary"
            onClick={() => {
              setMode('create');
              setSelectedKey(undefined);
              setNotice('');
              setError('');
            }}
            disabled={busy}
          >
            <IconPlus />
            {t('panel.create')}
          </button>
        </div>
      </header>
      <div className="skh-tabs">
        {[
          ['all', t('panel.allSkills')],
          ['library', t('panel.mySkills')],
          ['plugins', t('plugins.title')],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={mode === 'browse' && filter === key ? 'skh-tab skh-tab-active' : 'skh-tab'}
            onClick={() => {
              setMode('browse');
              setFilter(key);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {filter === 'plugins' && mode === 'browse' ? null : (
        <div className="skh-stats">
          {[
            ['total', stats.total, t('stats.total')],
            ['library', stats.library, t('stats.library')],
            ['written', stats.written, t('stats.written')],
            ['collected', stats.collected, t('stats.collected')],
            ['conflicts', stats.conflicts, t('stats.conflicts')],
          ].map(([key, value, label]) => (
            <div className="skh-stat" key={key}>
              <span className="skh-stat-value">{value}</span>
              <span className="skh-stat-label">{label}</span>
            </div>
          ))}
        </div>
      )}
      <div className="skh-toolbar">
        <div className="skh-client-filter">
          <button
            type="button"
            className="skh-btn skh-client-filter-btn"
            aria-label={t('panel.clientFilter')}
            aria-haspopup="listbox"
            aria-expanded={clientMenuOpen}
            onClick={() => setClientMenuOpen((open) => !open)}
          >
            {selectedClient.id === 'all' ? null : <ClientMark id={selectedClient.id} />}
            <span>{selectedClient.label}</span>
          </button>
          {clientMenuOpen ? (
            <div className="skh-client-menu" role="listbox" aria-label={t('panel.clientFilter')}>
              {clientChoices.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  role="option"
                  className="skh-client-option"
                  aria-selected={client.id === clientFilter}
                  onClick={() => {
                    setClientFilter(client.id);
                    setClientMenuOpen(false);
                  }}
                >
                  {client.id === 'all' ? <span className="skh-mark" /> : <ClientMark id={client.id} />}
                  {client.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <input
          className="skh-input skh-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('panel.searchPlaceholder')}
          aria-label={t('panel.searchPlaceholder')}
          spellCheck={false}
        />
      </div>
      {status}
      <div className={filter === 'plugins' && mode === 'browse' ? 'skh-body skh-body-plugins' : 'skh-body'}>
        {filter === 'plugins' && mode === 'browse' ? (
          <PluginsPanel t={t} query={query} clientFilter={clientFilter} />
        ) : (
          <aside className="skh-list">{listContent}</aside>
        )}
        {filter === 'plugins' && mode === 'browse' ? null : (
          <section className="skh-detail">{detailContent}</section>
        )}
      </div>
      {t('footer.note') === '' && t('footer.rule') === '' ? null : (
        <footer className="skh-footer">
          {t('footer.note') === '' ? null : <span>{t('footer.note')}</span>}
          {t('footer.rule') === '' ? null : <span>{t('footer.rule')}</span>}
        </footer>
      )}
    </div>
  );
}
