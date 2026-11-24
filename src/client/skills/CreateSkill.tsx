import { Button, Input } from '@deepseek-ai/dsh-client-ui-primitives';
import * as React from 'react';

export function CreateForm({ t, busy, onCreate, onCancel }) {
  const [form, setForm] = React.useState({
    root: 'personal',
    name: '',
    description: '',
    whenToUse: '',
    content: '',
  });
  const [error, setError] = React.useState('');
  const set = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.name) ||
      form.description.trim() === '' ||
      form.content.trim() === ''
    ) {
      setError(t('create.required'));
      return;
    }
    setError('');
    onCreate(form);
  };
  return (
    <form className="skh-form" onSubmit={submit}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="skh-title">{t('create.title')}</div>
        <Button
          type="button"
          size="sm" variant="outline"
          style={{ marginLeft: 'auto' }}
          onClick={onCancel}
          disabled={busy}
        >
          {t('create.back')}
        </Button>
      </div>
      <label className="skh-field">
        <span className="skh-label">{t('create.root')}</span>
        <select className="skh-select" value={form.root} onChange={set('root')} disabled={busy}>
          <option value="personal">{t('create.rootPersonal')}</option>
        </select>
      </label>
      <label className="skh-field">
        <span className="skh-label">{t('create.name')}</span>
        <Input
          className="skh-text-field"
          value={form.name}
          onChange={set('name')}
          placeholder="my-workflow"
          autoComplete="off"
          spellCheck={false}
          disabled={busy}
        />
        <span className="skh-help">{t('create.nameHint')}</span>
      </label>
      <label className="skh-field">
        <span className="skh-label">{t('create.description')}</span>
        <Input
          className="skh-text-field"
          value={form.description}
          onChange={set('description')}
          placeholder={t('create.descriptionHint')}
          disabled={busy}
        />
      </label>
      <label className="skh-field">
        <span className="skh-label">{t('create.whenToUse')}</span>
        <Input
          className="skh-text-field"
          value={form.whenToUse}
          onChange={set('whenToUse')}
          placeholder={t('create.whenToUseHint')}
          disabled={busy}
        />
      </label>
      <label className="skh-field">
        <span className="skh-label">{t('create.content')}</span>
        <textarea
          className="skh-editor"
          value={form.content}
          onChange={set('content')}
          placeholder={'# Workflow\n\n1. …'}
          spellCheck={false}
          disabled={busy}
        />
        <span className="skh-help">{t('create.contentHint')}</span>
      </label>
      {error === '' ? null : (
        <div className="skh-status skh-status-error" role="alert">
          {error}
        </div>
      )}
      <div className="skh-actions">
        <Button type="submit" size="sm" variant="primary" disabled={busy}>
          {busy ? <span className="skh-spin" /> : null}
          {t('create.submit')}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={busy}>
          {t('create.cancel')}
        </Button>
      </div>
    </form>
  );
}
