import * as React from 'react';
import { request, messageOf } from '../api';
import { identity, normalizeSkill } from './model';

export function useSkillLibrary(
  mode: string,
  t: (key: string, vars?: Record<string, unknown>) => string,
  setError: (message: string) => void,
) {
  const requestId = React.useRef(0);
  const [data, setData] = React.useState(undefined);
  const [loading, setLoading] = React.useState(true);
  const [selectedKey, setSelectedKey] = React.useState(undefined);
  const [detail, setDetail] = React.useState(undefined);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [tick, setTick] = React.useState(0);
  const allSkills = React.useMemo(
    () =>
      data === undefined
        ? []
        : Array.isArray(data.skills)
          ? data.skills.map((skill) => normalizeSkill(skill, skill.inLibrary === undefined))
          : data.groups.flatMap((entry) =>
              entry.skills.map((skill) => normalizeSkill(skill, entry.key === 'personal')),
            ),
    [data],
  );
  const selected = React.useMemo(
    () => allSkills.find((skill) => identity(skill) === selectedKey),
    [allSkills, selectedKey],
  );
  const selectedIdentity = selected === undefined ? undefined : identity(selected);

  const load = React.useCallback(
    async (selectPath?: string) => {
      const id = ++requestId.current;
      setLoading(true);
      setError('');
      try {
        const next = await request('/list');
        if (id !== requestId.current) return;
        setData(next);
        const items = Array.isArray(next.skills) ? next.skills : next.groups.flatMap((entry) => entry.skills);
        setSelectedKey((previous) => {
          if (selectPath !== undefined) {
            const found = items.find((skill) => skill.path === selectPath);
            if (found !== undefined) return identity(found);
          }
          if (previous !== undefined && items.some((skill) => identity(skill) === previous)) return previous;
          return items.length === 0 ? undefined : identity(items[0]);
        });
        return next;
      } catch (caught) {
        if (id === requestId.current) setError(t('error.load', { error: messageOf(caught) }));
        return undefined;
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [t],
  );

  React.useEffect(() => {
    load();
    return () => {
      requestId.current++;
    };
  }, [load]);

  React.useEffect(() => {
    if (
      mode !== 'browse' ||
      selected === undefined ||
      selected.path === undefined ||
      selected.path === null
    ) {
      setDetail(undefined);
      setDraft('');
      return undefined;
    }
    let cancelled = false;
    setDetail(undefined);
    setDraft('');
    setDetailLoading(true);
    setError('');
    request(`/read?name=${encodeURIComponent(selected.name)}&path=${encodeURIComponent(selected.path)}`)
      .then((next) => {
        if (cancelled) return;
        setDetail(next);
        setDraft(next.content);
      })
      .catch((caught) => {
        if (!cancelled) setError(t('error.read', { error: messageOf(caught) }));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, selectedIdentity, tick, t]);

  const refresh = React.useCallback(
    async (selectPath?: string) => {
      const next = await load(selectPath);
      if (next !== undefined) setTick((value) => value + 1);
      return next;
    },
    [load],
  );

  return {
    data,
    loading,
    allSkills,
    selected,
    selectedKey,
    setSelectedKey,
    detail,
    detailLoading,
    draft,
    setDraft,
    load,
    refresh,
  };
}
