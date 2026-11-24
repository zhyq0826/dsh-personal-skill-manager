import { Switch as HostSwitch, Tag } from '@deepseek-ai/dsh-client-ui-primitives';

const tones = { ok: 'success', warn: 'warning', error: 'danger', muted: 'outline' } as const;

export function Badge({ children, tone = 'muted' }) {
  return <Tag tone={tones[tone]}>{children}</Tag>;
}

export function Switch({ checked, onChange, label, hint, disabled }) {
  return <label className="skh-switch-field">
    <HostSwitch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    <span className="skh-switch-text">
      <span className="skh-switch-label">{label}</span>
      {hint && <span className="skh-switch-hint">{hint}</span>}
    </span>
  </label>;
}
