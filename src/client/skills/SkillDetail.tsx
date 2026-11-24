import { formatBytes } from './model';
import { IconStar, IconCopy, IconTrash, ClientMark } from '../components/Icons';
import { Badge, Switch } from '../components/Controls';

export function Detail({
  t,
  skill,
  detail,
  draft,
  setDraft,
  busy,
  detailLoading,
  onSave,
  onReset,
  onFavorite,
  onSaveAsMine,
  onDistribute,
  onCopy,
  onDelete,
  onToggleInvocation,
}) {
  if (detailLoading && detail === undefined) {
    return (
      <div className="skh-empty-detail">
        <span className="skh-spin" /> {t('list.loading')}
      </div>
    );
  }
  if (detail === undefined) {
    return <div className="skh-empty-detail">{t('detail.select')}</div>;
  }
  const inLibrary = skill.inLibrary === true;
  const inCatalog = skill.inCatalog === true;
  const personal = inLibrary && skill.kind === 'personal';
  const dirty = draft !== detail.content;
  const kindLabel = personal ? t('kind.personal') : null;
  const badges = [
    kindLabel ? (
      <Badge key="kind" tone="ok">
        {kindLabel}
      </Badge>
    ) : null,
    skill.collectedFrom ? (
      <Badge key="collected-from">{`${t('detail.collectedFrom', { client: skill.collectedFrom.label ?? skill.collectedFrom.id })}`}</Badge>
    ) : null,
    detail.linked ? <Badge key="link">{t('badge.linked')}</Badge> : null,
  ].filter(Boolean);
  const clientBadges = (skill.clients ?? [])
    .filter((client) => client.id !== 'library')
    .map((client) => (
      <Badge
        key={client.id}
        tone={client.state === 'conflict' ? 'error' : client.state === 'missing' ? 'warn' : 'ok'}
      >
        <ClientMark id={client.id} />
        {`${client.label ?? client.id}: ${t(`sync.state.${client.state}`)}`}
      </Badge>
    ));
  const fileRows = detail.files.map((file) => (
    <li key={file.path}>{`${file.path} · ${formatBytes(file.bytes)}`}</li>
  ));
  const actions = [];
  if (inLibrary) {
    actions.push(
      <button
        key="save"
        type="button"
        className="skh-btn skh-btn-primary"
        onClick={onSave}
        disabled={busy || !detail.editable || !dirty}
      >
        {t('detail.save')}
      </button>,
      <button
        key="reset"
        type="button"
        className="skh-btn"
        onClick={onReset}
        disabled={busy || !detail.editable || !dirty}
      >
        {t('detail.reset')}
      </button>,
    );
    if (detail.deletable && !detail.linked) {
      actions.push(
        <button
          key="delete"
          type="button"
          className="skh-btn skh-btn-danger"
          onClick={onDelete}
          disabled={busy}
        >
          <IconTrash />
          {t('detail.delete')}
        </button>,
      );
    }
  } else if (inCatalog || skill.kind === 'collected') {
    actions.push(
      <button key="favorite" type="button" className="skh-btn" onClick={onFavorite} disabled={busy}>
        <IconStar filled={true} />
        {t('detail.unfavorite')}
      </button>,
      <button key="mine" type="button" className="skh-btn" onClick={onSaveAsMine} disabled={busy}>
        {t('detail.saveAsMine')}
      </button>,
    );
  }
  if (inLibrary && skill.kind === 'collected') {
    actions.push(
      <button key="mine" type="button" className="skh-btn" onClick={onSaveAsMine} disabled={busy}>
        {t('detail.saveAsMine')}
      </button>,
    );
  }
  return (
    <div>
      <div className="skh-detail-head">
        <div className="skh-detail-title">{detail.name}</div>
        {inCatalog || skill.kind === 'collected' ? (
          <button
            type="button"
            className="skh-star skh-star-on"
            onClick={onFavorite}
            disabled={busy}
            title={t('detail.unfavorite')}
            aria-label={t('detail.unfavorite')}
            aria-pressed={true}
          >
            <IconStar filled={true} />
          </button>
        ) : null}
      </div>
      <div className="skh-detail-sub">{badges}</div>
      <div className="skh-path">
        <span className="skh-path-text">{detail.path}</span>
        <button
          type="button"
          className="skh-icon-btn"
          onClick={onCopy}
          title={t('detail.copyPath')}
          aria-label={t('detail.copyPath')}
        >
          <IconCopy />
        </button>
      </div>
      {clientBadges.length > 0 ? (
        <div className="skh-section">
          <div className="skh-section-title">{t('detail.clients')}</div>
          <div className="skh-row-meta">{clientBadges}</div>
        </div>
      ) : null}
      {personal && Array.isArray(skill.targets) && skill.targets.length > 0 ? (
        <div className="skh-section">
          <div className="skh-section-title">{t('detail.targets')}</div>
          <div className="skh-target-actions">
            {skill.targets.map((target) => (
              <div className="skh-target-action" key={target.id}>
                <Badge
                  tone={target.state === 'conflict' ? 'error' : target.state === 'missing' ? 'warn' : 'ok'}
                >{`${target.label}: ${t(`sync.state.${target.state}`)}`}</Badge>
                {target.state === 'conflict' ? (
                  <button
                    type="button"
                    className="skh-btn"
                    disabled={busy}
                    onClick={() => onDistribute(target.id, true)}
                  >
                    {t('detail.replaceHere')}
                  </button>
                ) : target.state === 'missing' ? (
                  <button
                    type="button"
                    className="skh-btn"
                    disabled={busy}
                    onClick={() => onDistribute(target.id, false)}
                  >
                    {t('detail.distributeTo')}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <div className="skh-note">{t('detail.targetsHelp')}</div>
        </div>
      ) : null}
      {detail.whenToUse ? (
        <div className="skh-section">
          <div className="skh-section-title">{t('detail.whenToUse')}</div>
          <div className="skh-when">{detail.whenToUse}</div>
        </div>
      ) : null}
      {inLibrary && detail.editable ? (
        <div className="skh-toggles">
          <Switch
            checked={detail.modelInvocable}
            onChange={() => onToggleInvocation('model')}
            label={t('detail.modelToggle')}
            hint={t('detail.modelHint')}
            disabled={busy}
          />
          <Switch
            checked={detail.userInvocable}
            onChange={() => onToggleInvocation('user')}
            label={t('detail.userToggle')}
            hint={t('detail.userHint')}
            disabled={busy}
          />
        </div>
      ) : null}
      <div className="skh-section">
        <div className="skh-section-title">{t('detail.editor')}</div>
        {detail.editable ? (
          <textarea
            className="skh-editor"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            spellCheck={false}
            disabled={busy}
            aria-label={t('detail.editor')}
          />
        ) : (
          <pre className="skh-pre">{detail.content}</pre>
        )}
        {detail.editable ? (
          <div className={dirty ? 'skh-dirty' : 'skh-clean'}>
            {dirty ? t('detail.dirty') : t('detail.clean')}
          </div>
        ) : (
          <div className="skh-note">
            {personal ? t('detail.readonlyNote') : inLibrary ? t('detail.legacyCollectedNote') : ''}
          </div>
        )}
        {detail.linked ? <div className="skh-note">{t('detail.linkedNote')}</div> : null}
        {actions.length > 0 ? <div className="skh-actions">{actions}</div> : null}
        {inLibrary && detail.editable ? <div className="skh-note">{t('detail.editNote')}</div> : null}
      </div>
      <details className="skh-files">
        <summary>{t('detail.files', { count: detail.files.length })}</summary>
        {detail.files.length === 0 ? <div>{t('detail.noFiles')}</div> : <ul>{fileRows}</ul>}
        <div
          style={{ marginTop: 6 }}
        >{`${t('detail.digest')}: ${String(detail.digest ?? '').slice(0, 12)}…`}</div>
      </details>
    </div>
  );
}
