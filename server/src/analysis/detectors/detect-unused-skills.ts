import { formatTokens, formatUSD } from '../format.ts'
import { skillGroupOf } from '../skill-group.ts'
import type { Finding } from '../report-types.ts'
import type { Detector } from './detector-context.ts'
import { fixedContextCostUSD, severityFor } from './detector-context.ts'

type SkillGroupUsage = {
  group: string
  skills: Set<string>
  tokens: number
  sessions: Set<string>
  costUSD: number
  invocations: number
}

export const detectUnusedSkills: Detector = ({ metrics, rates, totalCostUSD }) => {
  const invokedSkills = new Set<string>()
  for (const metric of metrics) {
    for (const toolCall of metric.toolCalls) if (toolCall.name === 'Skill') invokedSkills.add(toolCall.target)
  }
  const groups = new Map<string, SkillGroupUsage>()
  for (const metric of metrics) {
    for (const skill of metric.session.listedSkills) {
      if (invokedSkills.has(skill.name)) continue
      const groupName = skillGroupOf(skill.name)
      const group = groups.get(groupName) ?? { group: groupName, skills: new Set(), tokens: 0, sessions: new Set(), costUSD: 0, invocations: 0 }
      const tokens = skill.chars * metric.tokensPerSectionChar
      group.skills.add(skill.name)
      group.tokens += tokens
      group.sessions.add(metric.session.sessionId)
      group.costUSD += fixedContextCostUSD(tokens, metric, rates)
      groups.set(groupName, group)
    }
  }
  const ranked = [...groups.values()].sort((left, right) => right.costUSD - left.costUSD)
  if (ranked.length === 0) return null
  const impactUSD = ranked.reduce((total, group) => total + group.costUSD, 0)
  const unusedSkillCount = ranked.reduce((total, group) => total + group.skills.size, 0)
  return {
    id: 'unused-skills',
    title: 'Skills listés dans chaque requête mais jamais invoqués',
    severity: severityFor(impactUSD, totalCostUSD),
    impactUSD,
    impactTokens: ranked.reduce((total, group) => total + group.tokens / group.sessions.size, 0),
    summary: `${unusedSkillCount} skills n’ont jamais été invoqués sur la période (${invokedSkills.size} l’ont été). Leur description est pourtant relue à chaque requête : ${formatUSD(impactUSD)}.`,
    recommendations: [
      'Désinstalle les packs de skills hors de ton stack (`~/.claude/skills/`, plugins) ou déplace-les au niveau des seuls projets qui en ont besoin (`.claude/skills/` du projet).',
      'Pour les skills internes, raccourcis la ligne `description` : c’est elle qui est relue à chaque requête, pas le corps du SKILL.md.',
    ],
    evidence: ranked.slice(0, 12).map((group) => ({
      label: group.skills.size > 1 ? `${group.group} (${group.skills.size} skills)` : group.group,
      value: `${formatTokens(group.tokens / group.sessions.size)} tokens / requête`,
      detail: `${formatUSD(group.costUSD)} · 0 invocation`,
    })),
  } satisfies Finding
}
