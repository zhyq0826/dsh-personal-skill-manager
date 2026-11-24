import { Button, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import * as React from 'react';
import { messageOf } from '../api';
import { formatBytes, isCommunitySkill, isWrittenSkill } from './model';
import { IconStar, IconCopy, IconTrash, ClientMark } from '../components/Icons';
import { Badge, Switch } from '../components/Controls';
import { distributionNotice } from '../sync/distribution';

function TargetRow({ t, target, dirty, busy, onDistribute }) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');
  const conflict = target.state === 'conflict';
  const actionable = conflict || target.state === 'missing';
  const distribute = async () => {
    setPending(true);
    setError('');
    try {
      const result = await onDistribute(target.id, conflict);
      if (result.failed || result.conflicts || !result.results.length) {
        setError(result.results.find(entry => entry.error)?.error || distributionNotice(result, [target], t));
      }
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setPending(false);
    }
  };
  return <div className="skh-target-action">
    <ClientMark id={target.id} />
    <strong>{target.label}</strong>
    <span role="status"><Badge tone={conflict ? 'error' : actionable ? 'warn' : 'ok'}>
      {t(pending ? 'distribution.pending' : `sync.state.${target.state}`)}
    </Badge></span>
    {actionable && <Tooltip disabled={!conflict || busy || pending} portal side="bottom" maxWidth={320} openOnClick
      label={[t('detail.targetsHelp', { client: target.label }), dirty && t('detail.savedOnly')].filter(Boolean).join(' ')}>
      <Button type="button" size="sm" variant="outline" onClick={distribute} disabled={busy || pending}>
      {t(conflict ? 'detail.replaceHere' : 'detail.distributeTo', { client: target.label })}
      </Button>
    </Tooltip>}
    {error && <p className="skh-inline-error" role="alert">{error}</p>}
  </div>;
}

export function Detail({ t, skill, detail, draft, setDraft, busy, favoritePending, detailLoading,
  onSave, onReset, onFavorite, onSaveAsMine, onDistribute, onCopy, onDelete, onToggleInvocation }) {
  const dirty = Boolean(detail && draft !== detail.content);
  const personal = isWrittenSkill(skill);
  const favorite = isCommunitySkill(skill);
  const targets = personal ? skill.targets : [];
  const clients = skill.clients.filter(client => client.id !== 'library');
  return <div>
    <div className="skh-detail-head">
      <div className="skh-detail-title">{skill.name}</div>
      {personal && <Badge>{t('kind.personal')}</Badge>}
      {!personal && <button type="button" className={favorite ? 'skh-star skh-star-on' : 'skh-star'} onClick={onFavorite}
        disabled={busy || favoritePending} aria-pressed={favorite} aria-label={t(favorite ? 'detail.unfavorite' : 'detail.favorite')}>
        <IconStar filled={favorite} />
      </button>}
    </div>
    {skill.description && <p className="skh-description">{skill.description}</p>}
    {detail && <div className="skh-path"><span className="skh-path-text">{detail.path}</span>
      <button className="skh-icon-btn" onClick={onCopy} aria-label={t('detail.copyPath')}><IconCopy /></button></div>}
    {skill.collectedFrom && <Badge>{t('detail.collectedFrom', { client: skill.collectedFrom.label ?? skill.collectedFrom.id })}</Badge>}
    {favorite && <Button size="sm" variant="outline" disabled={busy} onClick={onSaveAsMine}>{t('detail.saveAsMine')}</Button>}
    {clients.length > 0 && <div className="skh-section"><div className="skh-section-title">{t('detail.clients')}</div>
      <div className="skh-row-meta">{clients.map(client => <Badge key={client.id}><ClientMark id={client.id} />
        {client.label ?? client.id}{targets.some(target => target.id === client.id) ? '' : ` · ${t(`sync.state.${client.state}`)}`}</Badge>)}</div></div>}
    {targets.length > 0 && <div className="skh-section"><div className="skh-section-title">{t('detail.targets')}</div>
      <div className="skh-target-actions">{targets.map(target => <TargetRow key={target.id} {...{ t, target, dirty, busy, onDistribute }} />)}</div>
    </div>}
    {!detail ? <p role="status">{t(detailLoading ? 'list.loading' : 'detail.select')}</p> : <>
      {detail.whenToUse && <p className="skh-when">{detail.whenToUse}</p>}
        {skill.inLibrary && detail.editable && <div className="skh-toggles">
          <Switch checked={detail.modelInvocable} onChange={() => onToggleInvocation('model')} label={t('detail.modelToggle')} hint={t('detail.modelHint')} disabled={busy || dirty} />
          <Switch checked={detail.userInvocable} onChange={() => onToggleInvocation('user')} label={t('detail.userToggle')} hint={t('detail.userHint')} disabled={busy || dirty} />
          {dirty && <p className="skh-note">{t('detail.saveBeforeToggle')}</p>}
        </div>}
      <div className="skh-section">
        <div className="skh-section-title">{t('detail.editor')}</div>
        {detail.editable ? <>
          <textarea className="skh-editor" aria-label={t('detail.editor')} value={draft} disabled={busy}
            spellCheck={false} onChange={event => setDraft(event.target.value)} />
          <div className={dirty ? 'skh-dirty' : 'skh-clean'}>{t(dirty ? 'detail.dirty' : 'detail.clean')}</div>
          <div className="skh-actions">
            <Button size="sm" variant="primary" disabled={busy || !dirty} onClick={onSave}>{t('detail.save')}</Button>
            <Button size="sm" variant="outline" disabled={busy || !dirty} onClick={onReset}>{t('detail.reset')}</Button>
          </div>
        </> : <pre className="skh-pre">{detail.content}</pre>}
        {detail.linked && <p className="skh-note">{t('detail.linkedNote')}</p>}
      </div>
        <details className="skh-files"><summary>{t('detail.files', { count: detail.files.length })}</summary>
          {detail.files.length ? <ul>{detail.files.map(file => <li key={file.path}>{file.path} · {formatBytes(file.bytes)}</li>)}</ul> : t('detail.noFiles')}
          <p>{t('detail.digest')} · {String(detail.digest).slice(0, 12)}…</p>
        </details>
      {skill.inLibrary && detail.deletable && !detail.linked && <details className="skh-files"><summary>{t('detail.more')}</summary>
        <Button size="sm" variant="outline" className="skh-btn-danger" disabled={busy} onClick={onDelete}><IconTrash />{t('detail.delete')}</Button>
      </details>}
    </>}
  </div>;
}
