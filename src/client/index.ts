import { zh } from './i18n/zh';
import { en } from './i18n/en';
import { SidebarIcon } from './components/Icons';
import { Panel } from './skills/SkillsPage';

export const inject = ['slots', 'locale'];
const NS = 'dsh-personal-skill-manager';

export function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-personal-skill-manager: dictionaries');
  const t = ctx.locale.bind(NS);
  ctx.effect(
    () =>
      ctx.slots.inject('main', () =>
        ctx.slots.register(
          { name: 'main', key: 'dsh-personal-skill-manager', locale: NS, inject: () => ({ t }) },
          Panel,
        ),
      ),
    'dsh-personal-skill-manager: main panel',
  );
  ctx.effect(
    () =>
      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: 'dsh-personal-skill-manager',
            order: 12,
            locale: NS,
            label: () => t('panel.title'),
          },
          SidebarIcon,
        ),
      ),
    'dsh-personal-skill-manager: sidebar entry',
  );
}
