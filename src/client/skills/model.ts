export function identity(skill) {
  return skill.name;
}

export function normalizeSkill(skill, fallbackLibrary) {
  return {
    ...skill,
    inLibrary: skill.inLibrary === true || (skill.inLibrary === undefined && fallbackLibrary === true),
    kind: skill.kind ?? (fallbackLibrary === true ? 'personal' : 'client'),
    clients: Array.isArray(skill.clients) ? skill.clients : [],
    clientIds: Array.isArray(skill.clientIds) ? skill.clientIds : [],
    targets: Array.isArray(skill.targets) ? skill.targets : [],
  };
}

export function isWrittenSkill(skill) {
  return skill.inLibrary === true && skill.kind === 'personal';
}

export function isCommunitySkill(skill) {
  return skill.inCatalog === true || (skill.inLibrary === true && skill.kind === 'collected');
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
