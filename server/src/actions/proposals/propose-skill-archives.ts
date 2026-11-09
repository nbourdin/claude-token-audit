import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fixedContextCostUSD } from '../../analysis/detectors/detector-context.ts'
import { formatTokens, groupBy } from '../../analysis/format.ts'
import { skillGroupOf } from '../../analysis/skill-group.ts'
import { config } from '../../config.ts'
import type { ProposedAction } from '../action-types.ts'
import type { ProposalContext } from './proposal-context.ts'

const OTHER_SKILLS_GROUP = 'divers'

export function proposeSkillArchives({ allSessions, recentMetrics, rates }: ProposalContext): ProposedAction[] {
  const invokedSkills = new Set(allSessions.flatMap((session) => session.toolCalls.filter((call) => call.name === 'Skill').map((call) => call.target)))
  const listedSkills = new Set(recentMetrics.flatMap((metric) => metric.session.listedSkills.map((skill) => skill.name)))
  const candidates = [...listedSkills].filter((name) => !invokedSkills.has(name) && existsSync(join(config.claudeSkillsDirectory, name)))
  const groups = groupBy(candidates, skillGroupOf)
  const isolatedSkills = [...groups.entries()].filter(([, names]) => names.length === 1).flatMap(([, names]) => names)
  const groupedEntries = [...groups.entries()].filter(([, names]) => names.length > 1)
  if (isolatedSkills.length > 0) groupedEntries.push([OTHER_SKILLS_GROUP, isolatedSkills])
  return groupedEntries.map(([group, skillNames]) => {
    const names = new Set(skillNames)
    let monthlyCostUSD = 0
    let tokensPerRequest = 0
    for (const metric of recentMetrics) {
      const tokens = metric.session.listedSkills.filter((skill) => names.has(skill.name)).reduce((total, skill) => total + skill.chars * metric.tokensPerSectionChar, 0)
      monthlyCostUSD += fixedContextCostUSD(tokens, metric, rates)
      tokensPerRequest = Math.max(tokensPerRequest, tokens)
    }
    return {
      key: `archive-skills:${group}`,
      findingId: 'unused-skills',
      title: skillNames.length > 1 ? `Archiver les ${skillNames.length} skills « ${group} »` : `Archiver le skill « ${group} »`,
      rationale: `Jamais invoqué${skillNames.length > 1 ? 's' : ''} sur tout l’historique, mais relu${skillNames.length > 1 ? 's' : ''} à chaque requête (~${formatTokens(tokensPerRequest)} tokens).`,
      changes: skillNames.sort().map((name) => ({ target: `~/.claude/skills/${name}`, description: `déplacé vers ~/.claude/${config.claudeSkillsArchiveDirectory.split('/').at(-1)}/${name}` })),
      estimatedMonthlySavingUSD: monthlyCostUSD,
      project: null,
      caveat: 'Déplacement, pas suppression : Annuler remet les dossiers en place.',
      payload: { kind: 'archive-skills', skillNames },
    }
  })
}
