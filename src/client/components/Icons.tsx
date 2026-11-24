export function IconStar({ filled }) {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="m12 3.6 2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z" />
    </svg>
  );
}

export function IconRefresh() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden={true}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconCopy() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <rect x={8} y={8} width={11} height={11} rx={2} />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

export function IconTrash() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="M4 7h16M9 7V5h6v2M6 7l1 14h10l1-14M10 11v6M14 11v6" />
    </svg>
  );
}

export const BRANDS = {
  codex:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#10a37f" d="M6.13671 5.82399V4.30398C6.13671 4.17596 6.18431 4.07991 6.29527 4.01598L9.32406 2.256C9.73637 2.01602 10.228 1.90406 10.7353 1.90406C12.6382 1.90406 13.8434 3.3921 13.8434 4.97604C13.8434 5.088 13.8434 5.21602 13.8274 5.34404L10.6877 3.488C10.4975 3.37605 10.3071 3.37605 10.1168 3.488L6.13671 5.82399ZM13.209 11.7441V8.11195C13.209 7.88789 13.1138 7.72791 12.9236 7.61594L8.94344 5.27995L10.2437 4.5279C10.3547 4.46397 10.4499 4.46397 10.5609 4.5279L13.5896 6.28789C14.4619 6.79996 15.0484 7.88789 15.0484 8.94385C15.0484 10.1598 14.335 11.28 13.209 11.7441ZM5.20114 8.54404L3.90086 7.77608C3.78989 7.71215 3.7423 7.6161 3.7423 7.48808V3.96811C3.7423 2.25615 5.04259 0.960061 6.80278 0.960061C7.46883 0.960061 8.08714 1.18413 8.61056 1.58409L5.48672 3.40816C5.29649 3.52012 5.20129 3.68011 5.20129 3.90418L5.20114 8.54404ZM7.99999 10.176L6.13671 9.12005V6.8801L7.99999 5.82414L9.8631 6.8801V9.12005L7.99999 10.176ZM9.19719 15.0401C8.53113 15.0401 7.91282 14.816 7.3894 14.4161L10.5132 12.5919C10.7034 12.48 10.7987 12.3201 10.7987 12.096V7.45596L12.1149 8.22392C12.2258 8.28785 12.2734 8.3839 12.2734 8.51192V12.0319C12.2734 13.7438 10.9572 15.0401 9.19719 15.0401ZM5.43898 11.4721L2.41018 9.71211C1.53796 9.20003 0.95134 8.11211 0.95134 7.05615C0.95134 5.82414 1.68077 4.72016 2.80657 4.25611V7.9041C2.80657 8.12817 2.90177 8.28815 3.092 8.40012L7.05637 10.72L5.75609 11.4721C5.64513 11.5361 5.54993 11.5361 5.43898 11.4721ZM5.26465 14.0961C3.47278 14.0961 2.15658 12.736 2.15658 11.056C2.15658 10.928 2.17249 10.8 2.18826 10.672L5.3121 12.4961C5.50234 12.608 5.69273 12.608 5.88297 12.4961L9.8631 10.1762V11.6962C9.8631 11.8242 9.8155 11.9202 9.70454 11.9841L6.67574 13.7441C6.26344 13.9841 5.77199 14.0961 5.26465 14.0961ZM9.19719 16C11.1159 16 12.7174 14.624 13.0823 12.8C14.8582 12.3359 16 10.6559 16 8.944C16 7.82396 15.5243 6.73603 14.668 5.95201C14.7473 5.61598 14.7949 5.27995 14.7949 4.94407C14.7949 2.65612 12.9554 0.944002 10.8305 0.944002C10.4025 0.944002 9.99013 1.00794 9.57782 1.15201C8.86416 0.447988 7.88099 0 6.80278 0C4.88403 0 3.28254 1.37593 2.91768 3.19999C1.14173 3.66404 0 5.34404 0 7.056C0 8.17604 0.475669 9.26397 1.33197 10.048C1.25269 10.384 1.20509 10.72 1.20509 11.0559C1.20509 13.3438 3.04456 15.0559 5.16946 15.0559C5.59753 15.0559 6.00984 14.9921 6.42215 14.848C7.13565 15.552 8.11882 16 9.19719 16Z"/></svg>',
  claude:
    '<svg fill="#D97757" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg>',
  cursor:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#1e1e20" fill-rule="evenodd" d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z"/></svg>',
  agents:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#10b981" d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h2a5 5 0 0 1 5 5v1a3 3 0 0 1 1 2.23V17a3 3 0 0 1-3 3h-1.1A6 6 0 0 1 12 22a6 6 0 0 1-4.9-2H6a3 3 0 0 1-3-3v-1.77A3 3 0 0 1 4 13v-1a5 5 0 0 1 5-5h2V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-3 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-6 5a4 4 0 0 0 6 0H9z"/></svg>',
  dsh: 'data:image/png;base64,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',
};

export function ClientMark({ id }) {
  const brand = BRANDS[id];
  if (brand === undefined) {
    const letter = String(id || '?')
      .slice(0, 1)
      .toUpperCase();
    return (
      <svg className="skh-mark" viewBox="0 0 24 24" aria-hidden={true}>
        <rect x={1} y={1} width={22} height={22} rx={5} fill="none" stroke="currentColor" strokeWidth={1.4} />
        <text
          x={12}
          y={16}
          textAnchor="middle"
          fontSize={11}
          fontFamily="ui-monospace,monospace"
          fill="currentColor"
        >
          {letter}
        </text>
      </svg>
    );
  }
  if (id === 'dsh') {
    return <img className="skh-mark" src={brand} alt="" />;
  }
  return <span className="skh-mark" dangerouslySetInnerHTML={{ __html: brand }} />;
}

export function IconSync() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
    >
      <path d="M20 11a8 8 0 0 0-13.7-5.7L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 13.7 5.7L20 16" />
      <path d="M20 20v-4h-4" />
    </svg>
  );
}

export function SidebarIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={true}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <g
        stroke="var(--dsw-alias-label-primary, currentColor)"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5.25 19.25V6.75a2.5 2.5 0 0 1 2.5-2.5h8.5a2.5 2.5 0 0 1 2.5 2.5v4.1" />
        <path d="M7.8 8.1h5.7" stroke="var(--dsw-alias-label-secondary, currentColor)" />
        <path d="M7.8 11.1h3.7" stroke="var(--dsw-alias-label-secondary, currentColor)" />
        <path d="M17.15 13.2c.45 2.08 1.48 3.11 3.55 3.55-2.07.45-3.1 1.48-3.55 3.55-.44-2.07-1.47-3.1-3.55-3.55 2.08-.44 3.11-1.47 3.55-3.55Z" />
        <path d="M20.8 11.1c.18.84.6 1.26 1.45 1.44-.85.19-1.27.61-1.45 1.46-.18-.85-.6-1.27-1.45-1.46.85-.18 1.27-.6 1.45-1.44Z" />
      </g>
    </svg>
  );
}
