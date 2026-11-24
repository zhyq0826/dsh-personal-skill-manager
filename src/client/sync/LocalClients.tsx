import { Button, Checkbox, Input } from '@deepseek-ai/dsh-client-ui-primitives';
import { ClientMark } from '../components/Icons';

export function LocalClients({ t, data, form, savedTargets, personalMeta, busy, unsaved, setTarget, setAuto, save, revert, distribute, favorite, distributionFeedback }) {
  const enabled = savedTargets.filter((target) => target.enabled);
  const collected = new Set(personalMeta.filter((skill) => skill.kind === 'collected').map((skill) => skill.name));
  const skills = (data?.skills ?? []).filter((skill) => !collected.has(skill.name));
  const conflicts = skills.some((skill) => skill.targets.some((target) => target.state === 'conflict'));
  const pending = skills.filter((skill) => skill.targets.some((target) => target.state === 'missing')).length;

  return <section className="skh-local">
    <header className="skh-local-head">
      <div><h2>{t('local.title')}</h2><p>{t('local.scope')}</p></div>
    </header>
    {!enabled.length && <p>{t('local.emptyClients')}</p>}
    {!data && <p role="alert">{t('local.unavailable')}</p>}
    {data && enabled.length > 0 && !skills.length && <p>{t('sync.noFavorites')}</p>}
    {form.targets.map((target, index) => {
      const active = enabled.some((saved) => saved.id === target.id);
      const states = skills.flatMap((skill) => {
        const entry = skill.targets.find((item) => item.id === target.id);
        return entry ? [{ name: skill.name, state: entry.state }] : [];
      });
      const missing = states.filter((item) => item.state === 'missing').length;
      const different = states.filter((item) => item.state === 'conflict').length;
      const installed = states.filter((item) => ['linked', 'present', 'source', 'copied'].includes(item.state)).length;
      return <details className="skh-local-client" key={target.id}>
        <summary><span className="skh-local-name"><ClientMark id={target.id} /><strong>{target.label}</strong></span>
          <span className="skh-local-counts">{active ? data && t('local.installed', { count: installed }) : t('sync.disabled')}
            {missing > 0 && <b>{t('local.missing', { count: missing })}</b>}
            {different > 0 && <b className="skh-conflict-text">{t('local.conflicts', { count: different })}</b>}
          </span><span className="skh-local-chevron" aria-hidden="true">›</span>
        </summary>
        <ul>{states.map((item) => <li key={item.name}><span>{item.name}</span><span>{t(`sync.state.${item.state}`)}</span></li>)}</ul>
        <fieldset className="skh-local-config" aria-label={target.label} disabled={busy}>
          <Checkbox checked={target.enabled} onChange={setTarget(index, 'enabled')} label={t('local.enable')} />
          {target.enabled && <>
            <label className="skh-local-field">{t('local.mode')}
              <select className="skh-select" value={target.mode} onChange={event => setTarget(index, 'mode')(event.target.value)}>
                <option value="link">{t('sync.modeLink')}</option><option value="copy">{t('sync.modeCopy')}</option>
              </select>
            </label>
            <p className="skh-local-help">{t(target.mode === 'link' ? 'sync.linkHint' : 'sync.copyHint')}</p>
            <details><summary>{t('sync.targetDirectory')}</summary>
              <Input className="skh-text-field" value={target.path} aria-label={`${target.label} · ${t('sync.targetDirectory')}`} onChange={event => setTarget(index, 'path')(event.target.value)} spellCheck={false} />
            </details>
          </>}
        </fieldset>
      </details>;
    })}
    {enabled.length > 0 && (pending > 0 || conflicts) && <div className="skh-actions">
      {pending > 0 && <Button type="button" size="sm" variant="primary" disabled={busy || unsaved} onClick={() => distribute(false)}>
        {t(enabled.length === 1 ? 'local.sendTo' : 'local.sendAll', { count: pending, client: enabled[0].label })}
      </Button>}
      {conflicts && <Button type="button" size="sm" variant="outline" disabled={busy || unsaved} onClick={() => distribute(true)}>{t('sync.distributeReplace')}</Button>}
    </div>}
    {distributionFeedback}
    <Checkbox checked={form.autoDistribute} disabled={busy} onChange={setAuto} label={t('sync.autoDistribute')} />
      {unsaved && <div className="skh-actions">
        <Button type="button" size="sm" variant="primary" disabled={busy} onClick={save}>{t('sync.save')}</Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={revert}>{t('sync.cancelSettings')}</Button>
      </div>}
    {data?.discover.length > 0 && <details className="skh-local-discover"><summary>{t('sync.targetOnly')} · {data.discover.length}</summary>
      {data.discover.map((item) => <div className="skh-sync-favorite" key={item.name}>
        <span className="skh-name">{item.name}</span><span>{item.targets.map((target) => target.targetLabel).join(' · ')}</span>
        <Button type="button" size="sm" variant="outline" disabled={busy || unsaved} onClick={() => favorite(item)}>{t('sync.collect')}</Button>
      </div>)}
    </details>}
  </section>;
}
