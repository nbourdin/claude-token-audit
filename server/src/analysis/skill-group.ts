const GROUPED_PREFIXES = new Set(['aws', 'cloudflare', 'figma', 'bmad', 'grill', 'workers'])

export function skillGroupOf(skillName: string): string {
  if (skillName.includes(':')) return skillName.split(':')[0] ?? skillName
  const prefix = skillName.split('-')[0] ?? skillName
  return GROUPED_PREFIXES.has(prefix) ? prefix : skillName
}
