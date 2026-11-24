export function distributionNotice(result, targets, t) {
  const groups = new Map<string, Map<string, number>>();
  for (const entry of result.results) {
    const counts = groups.get(entry.targetId) ?? new Map<string, number>();
    const state = entry.unchanged || entry.state === 'present' ? 'existing' : entry.state;
    counts.set(state, (counts.get(state) ?? 0) + 1);
    groups.set(entry.targetId, counts);
  }
  if (!groups.size) return t('distribution.empty');
  const summaries = Array.from(groups, ([id, counts]) => {
    const label = targets.find((target) => target.id === id)?.label ?? id;
    const items = Array.from(counts, ([state, count]) => t(`distribution.${state}`, { count }));
    return `${label} · ${items.join(' / ')}`;
  });
  if (result.name) summaries.unshift(result.name);
  return summaries.join(' · ');
}
