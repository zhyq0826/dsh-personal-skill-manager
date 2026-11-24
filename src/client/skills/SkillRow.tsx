import { Button, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import { isWrittenSkill, isCommunitySkill } from './model';
import { IconStar, ClientMark } from '../components/Icons';

export function Row({ t, skill, active, busy, error, onSelect, onFavorite }) {
  const written = isWrittenSkill(skill);
  const community = isCommunitySkill(skill);
  const clients = [];
  const seen = new Set();
  for (const client of skill.clients ?? []) {
    if (client.id === 'library' || seen.has(client.id)) continue;
    seen.add(client.id);
    clients.push(client);
  }
  const shown = clients.slice(0, 4);
  const hidden = clients.length - shown.length;
  const kindLabel = written ? t('kind.personal') : null;
  const kindClass = 'skh-kind skh-kind-written';
  return (
    <div
      className={active ? 'skh-row skh-row-active' : 'skh-row'}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="skh-row-main">
        <div className="skh-row-title">
          <span className="skh-name" title={skill.name}>
            {skill.name}
          </span>
          {kindLabel ? <span className={kindClass}>{kindLabel}</span> : null}
        </div>
        <div className="skh-row-desc" title={skill.description || ''}>
          {skill.description || t('detail.noDescription')}
        </div>
        {error && <span role="alert" className="skh-inline-error">{error}</span>}
        {shown.length === 0 ? null : (
          <div className="skh-clients" title={clients.map((client) => client.label ?? client.id).join(' · ')}>
            {shown.map((client) => (
              <span className="skh-client" key={client.id} title={client.label ?? client.id}>
                <ClientMark id={client.id} />
              </span>
            ))}
            {hidden > 0 ? (
              <span className="skh-client-more">{t('client.more', { count: hidden })}</span>
            ) : null}
          </div>
        )}
      </div>
      {written ? null : (
        <Tooltip label={t(community ? 'detail.unfavorite' : 'detail.favorite')} portal side="bottom">
        <Button size="sm" variant="ghost"
          type="button"
          className={community ? 'skh-star skh-star-on' : 'skh-star'}
          aria-label={community ? t('detail.unfavorite') : t('detail.favorite')}
          aria-pressed={community}
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation();
            onFavorite();
          }}
        >
          <IconStar filled={community} />
        </Button>
        </Tooltip>
      )}
    </div>
  );
}
