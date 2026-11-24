export function Badge({ children, tone = 'muted' }) {
  const className =
    tone === 'ok'
      ? 'skh-badge skh-badge-ok'
      : tone === 'warn'
        ? 'skh-badge skh-badge-warn'
        : tone === 'error'
          ? 'skh-badge skh-badge-error'
          : 'skh-badge';
  return <span className={className}>{children}</span>;
}

export function Switch({ checked, onChange, label, hint, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="skh-switch"
      onClick={onChange}
      disabled={disabled}
    >
      <span className="skh-switch-track">
        <span className="skh-switch-thumb" />
      </span>
      <span className="skh-switch-text">
        <span className="skh-switch-label">{label}</span>
        {hint === undefined ? null : <span className="skh-switch-hint">{hint}</span>}
      </span>
    </button>
  );
}
