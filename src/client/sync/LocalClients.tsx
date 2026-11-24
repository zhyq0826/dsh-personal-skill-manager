import { ClientMark } from '../components/Icons';

export function LocalClients({ t, data, form, savedTargets, personalMeta, busy, unsaved, setTarget, setAuto, save, revert, distribute, favorite }) {
  const enabled = savedTargets.filter((target) => target.enabled);
  const collected = new Set(personalMeta.filter((skill) => skill.kind === 'collected').map((skill) => skill.name));
  const skills = (data?.skills ?? []).filter((skill) => !collected.has(skill.name));
  const conflicts = skills.some((skill) => skill.targets.some((target) => target.state === 'conflict'));
  const pending = skills.filter((skill) => skill.targets.some((target) => target.state === 'missing')).length;

  const settings = (
    <details className="skh-local-discover">
      <summary>{t('local.settings')}</summary>
      {form.targets.map((target, index) => (
        <fieldset className="skh-local-config" key={target.id} disabled={busy}>
          <legend><ClientMark id={target.id} /> {target.label}</legend>
          <label className="skh-check"><input type="checkbox" checked={target.enabled} onChange={setTarget(index, 'enabled')} />{t('local.enable')}</label>
          {target.enabled && <>
            <label className="skh-local-field">{t('local.mode')}
              <select className="skh-select" value={target.mode} onChange={setTarget(index, 'mode')}>
                <option value="link">{t('sync.modeLink')}</option><option value="copy">{t('sync.modeCopy')}</option>
              </select>
            </label>
            <p className="skh-local-help">{t(target.mode === 'link' ? 'sync.linkHint' : 'sync.copyHint')}</p>
            <details><summary>{t('sync.targetDirectory')}</summary>
              <input className="skh-input" value={target.path} aria-label={`${target.label} · ${t('sync.targetDirectory')}`} onChange={setTarget(index, 'path')} spellCheck={false} />
            </details>
          </>}
        </fieldset>
      ))}
      <label className="skh-check"><input type="checkbox" checked={form.autoDistribute} disabled={busy} onChange={setAuto} />{t('sync.autoDistribute')}</label>
      {unsaved && <div className="skh-actions">
        <button type="button" className="skh-btn skh-btn-primary" disabled={busy} onClick={save}>{t('sync.save')}</button>
        <button type="button" className="skh-btn" disabled={busy} onClick={revert}>{t('sync.cancelSettings')}</button>
      </div>}
    </details>
  );

  return <section className="skh-local">
    <header className="skh-local-head">
      <div><h2>{t('local.title')}</h2><p>{t('local.scope')}</p></div>
    </header>
    {!enabled.length && <p>{t('local.emptyClients')}</p>}
    {!data && <p role="alert">{t('local.unavailable')}</p>}
    {data && enabled.length > 0 && !skills.length && <p>{t('sync.noFavorites')}</p>}
    {enabled.map((target) => {
      const states = skills.flatMap((skill) => {
        const entry = skill.targets.find((item) => item.id === target.id);
        return entry ? [{ name: skill.name, state: entry.state }] : [];
      });
      const missing = states.filter((item) => item.state === 'missing').length;
      const different = states.filter((item) => item.state === 'conflict').length;
      const installed = states.filter((item) => ['linked', 'present', 'source', 'copied'].includes(item.state)).length;
      return <details className="skh-local-client" key={target.id}>
        <summary><span className="skh-local-name"><ClientMark id={target.id} /><strong>{target.label}</strong></span>
          <span className="skh-local-counts">{data && t('local.installed', { count: installed })}
            {missing > 0 && <b>{t('local.missing', { count: missing })}</b>}
            {different > 0 && <b>{t('local.conflicts', { count: different })}</b>}
          </span><span className="skh-local-chevron" aria-hidden="true">›</span>
        </summary>
        <ul>{states.map((item) => <li key={item.name}><span>{item.name}</span><span>{t(`sync.state.${item.state}`)}</span></li>)}</ul>
        <p className="skh-local-help">{t(target.mode === 'link' ? 'sync.modeLink' : 'sync.modeCopy')}</p>
      </details>;
    })}
    {enabled.length > 0 && (pending > 0 || conflicts) && <div className="skh-actions">
      {pending > 0 && <button type="button" className="skh-btn skh-btn-primary" disabled={busy || unsaved} onClick={() => distribute(false)}>
        {t(enabled.length === 1 ? 'local.sendTo' : 'local.sendAll', { count: pending, client: enabled[0].label })}
      </button>}
      {conflicts && <button type="button" className="skh-btn" disabled={busy || unsaved} onClick={() => distribute(true)}>{t('sync.distributeReplace')}</button>}
    </div>}
    {settings}
    {data?.discover.length > 0 && <details className="skh-local-discover"><summary>{t('sync.targetOnly')} · {data.discover.length}</summary>
      {data.discover.map((item) => <div className="skh-sync-favorite" key={item.name}>
        <span className="skh-name">{item.name}</span><span>{item.targets.map((target) => target.targetLabel).join(' · ')}</span>
        <button type="button" className="skh-btn" disabled={busy || unsaved} onClick={() => favorite(item)}>{t('sync.collect')}</button>
      </div>)}
    </details>}
  </section>;
}
