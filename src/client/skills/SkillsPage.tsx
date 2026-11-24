import { Button, Input, Menu } from '@deepseek-ai/dsh-client-ui-primitives';
import * as React from 'react';
import { messageOf, request } from '../api';
import { identity, isWrittenSkill, isCommunitySkill } from './model';
import { IconRefresh, IconPlus, ClientMark, IconSync } from '../components/Icons';
import { useSkillLibrary } from './useSkillLibrary';
import { Row } from './SkillRow';
import { CreateForm } from './CreateSkill';
import { SyncPanel } from '../sync/SyncPage';
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
  const [favoritePending, setFavoritePending] = React.useState('');
  const [favoriteError, setFavoriteError] = React.useState({ name: '', message: '' });

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
    expectedDigest,
    clearDraft,
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

  const onFavorite = async (skill) => {
    const clientId = (skill.clients ?? []).find((client) => client.id !== 'library')?.id;
    setFavoritePending(skill.name);
    setFavoriteError({ name: '', message: '' });
    try {
      await request('/favorite', { method: 'POST', body: { name: skill.name, clientId, value: !isCommunitySkill(skill) } });
      await load();
    } catch (caught) {
      setFavoriteError({ name: skill.name, message: messageOf(caught) });
    } finally {
      setFavoritePending('');
    }
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

  const onDistribute = async (skill, targetId, replace) => {
    const { result } = await request('/distribute-skill', {
      method: 'POST', body: { name: skill.name, targetIds: [targetId], replaceConflicts: replace === true },
    });
    await load();
    return result;
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

  const onSave = async () => {
    if (selected === undefined || detail === undefined) return;
    const saved = await run(
      () =>
        request('/save', {
          method: 'POST',
          body: {
            name: selected.name,
            path: selected.path,
            cwd: data?.cwd,
            content: draft,
            expectedDigest,
          },
        }),
      () => t('notice.saved'),
      selected.path,
    );
    if (saved) clearDraft();
    return Boolean(saved);
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
    ).then(result => { if (result) clearDraft(); });
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
  const listedNames = new Set(allSkills.map((skill) => skill.name));
  const catalogOnly = (data?.catalog?.entries ?? []).filter((entry) => !listedNames.has(entry.name));
  const missingFavorites = catalogOnly.filter((entry) =>
    (clientFilter === 'all' || entry.collectedFrom?.id === clientFilter) &&
    entry.name.toLowerCase().includes(needle));
  const showCatalogOnly = filter === 'favorites' && missingFavorites.length > 0;
  const hasConflict = (skill) => skill.targets?.some((target) => target.state === 'conflict');
  const matchesFilter = (skill) => {
    if (filter === 'favorites' && !isCollected(skill)) return false;
    if (filter === 'conflicts' && !hasConflict(skill)) return false;
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

  const libraryCount = allSkills.filter((skill) => isWritten(skill) || isCollected(skill)).length;
  const conflictCount = allSkills.filter(hasConflict).length;
  const favoriteCount = allSkills.filter(isCollected).length + catalogOnly.length;
  const groupLabels = { all: 'panel.allSkills', library: 'panel.mySkills', favorites: 'panel.favorites', conflicts: 'stats.conflicts' };

  let listContent;
  if (loading && data === undefined) {
    listContent = (
      <div className="skh-empty">
        <span className="skh-spin" /> {t('list.loading')}
      </div>
    );
  } else if (filteredSkills.length === 0 && !showCatalogOnly) {
    listContent = <div className="skh-empty">{t('list.empty')}</div>;
  } else {
    listContent = (
      <section className="skh-group">
        <div className="skh-group-head">
          <span className="skh-group-title">
            {t(groupLabels[filter] ?? 'panel.allSkills')}
          </span>
          <span className="skh-group-count">{filteredSkills.length + (showCatalogOnly ? missingFavorites.length : 0)}</span>
        </div>
        {filteredSkills.map((skill) => (
          <Row
            key={identity(skill)}
            t={t}
            skill={skill}
            active={identity(skill) === selectedKey}
            busy={busy || Boolean(favoritePending)}
            error={favoriteError.name === skill.name ? favoriteError.message : ''}
            onSelect={() => onSelect(skill)}
            onFavorite={() => onFavorite(skill)}
          />
        ))}
        {showCatalogOnly && missingFavorites.map((entry) => (
          <div className="skh-sync-favorite" key={entry.name}>
            <span className="skh-name">{entry.name}</span>
            <span className="skh-help">{t('panel.favoriteNotLocal')}</span>
            {favoriteError.name === entry.name && <span role="alert">{favoriteError.message}</span>}
            <Button type="button" size="sm" variant="outline" disabled={busy || Boolean(favoritePending)} onClick={() => onFavorite({ ...entry, inCatalog: true })}>
              {t('detail.unfavorite')}
            </Button>
          </div>
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
        {query !== '' ? <Button type="button" size="sm" variant="outline" onClick={() => setQuery('')}>{t('list.clearSearch')}</Button> : null}
      </div>
    );
  } else {
    detailContent = (
      <Detail
        key={selected.path ?? selected.name}
        t={t}
        skill={selected}
        detail={detail}
        draft={draft}
        setDraft={setDraft}
        busy={busy}
        favoritePending={Boolean(favoritePending)}
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
      <div className="skh-toolbar">
        <Menu open={clientMenuOpen} portal compact selectedId={clientFilter}
          items={clientChoices.map(client => ({ id: client.id, label: client.label, icon: client.id === 'all' ? undefined : <ClientMark id={client.id} /> }))}
          onClose={() => setClientMenuOpen(false)} onSelect={id => { setClientFilter(id); setClientMenuOpen(false); }} anchor={
          <Button
            type="button"
            size="sm" variant="outline" className="skh-client-filter-btn"
            aria-label={t('panel.clientFilter')}
            aria-haspopup="menu"
            aria-expanded={clientMenuOpen}
            onClick={() => setClientMenuOpen((open) => !open)}
          >
            {selectedClient.id === 'all' ? null : <ClientMark id={selectedClient.id} />}
            <span>{selectedClient.label}</span>
          </Button>
        } />
        <Input
          className="skh-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('panel.searchPlaceholder')}
          aria-label={t('panel.searchPlaceholder')}
          spellCheck={false}
        />
      </div>
        <div className="skh-header-actions">
          <Button type="button" size="sm" variant="outline" onClick={() => refresh()} disabled={loading || busy}>
            <IconRefresh />
            {t('panel.refresh')}
          </Button>
          <Button
            type="button"
            size="sm" variant="outline"
            onClick={() => {
              setMode('sync');
              setNotice('');
              setError('');
            }}
            disabled={busy}
          >
            <IconSync />
            {t('panel.sync')}
          </Button>
          <Button
            type="button"
            size="sm" variant="primary"
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
          </Button>
        </div>
      </header>
      <div className="skh-tabs">
        {[
          ['all', t('panel.allSkills'), allSkills.length],
          ['library', t('panel.mySkills'), libraryCount],
          ['favorites', t('panel.favorites'), favoriteCount],
          ['plugins', t('plugins.title')],
          ...(conflictCount > 0 || filter === 'conflicts' ? [['conflicts', t('stats.conflicts'), conflictCount]] : []),
        ].map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            className={mode === 'browse' && filter === key ? 'skh-tab skh-tab-active' : 'skh-tab'}
            onClick={() => {
              setMode('browse');
              setFilter(String(key));
              if (key === 'conflicts') { setQuery(''); setClientFilter('all'); }
            }}
          >
            {label}{count !== undefined && data && <span className="skh-tab-count">{count}</span>}
          </button>
        ))}
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
