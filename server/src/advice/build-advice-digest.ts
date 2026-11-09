import { formatPercent, formatTokens, formatUSD } from '../analysis/format.ts'
import type { AuditReport } from '../analysis/report-types.ts'

const EVIDENCE_PER_FINDING = 8

export function buildAdviceDigest(report: AuditReport): string {
  const { totals, filter } = report
  const lines: string[] = []
  lines.push(`# Audit de consommation Claude Code`)
  lines.push(`Période : ${filter.sinceDays === null ? 'tout l’historique' : `${filter.sinceDays} derniers jours`} · projet : ${filter.project ?? 'tous'}`)
  lines.push(
    `Total : ${formatUSD(totals.costUSD)} équivalent API · ${totals.sessions} sessions · ${totals.requests} requêtes · ${totals.userPrompts} messages humains · ${formatUSD(totals.costPerUserPromptUSD)} par message humain`,
  )
  lines.push(
    `Contexte : socle moyen ${formatTokens(totals.averageBaselineTokens)} tokens au 1er appel · pic médian ${formatTokens(totals.medianPeakContextTokens)} · cache hit ${formatPercent(totals.cacheHitRatio)}`,
  )
  const composition = report.costComposition
  lines.push(
    `Répartition du coût : lecture cache ${formatPercent(composition.cacheRead / composition.total)} · écriture cache ${formatPercent(composition.cacheWrite / composition.total)} · sortie ${formatPercent(composition.output / composition.total)} · entrée non cachée ${formatPercent(composition.input / composition.total)}`,
  )
  lines.push(`Modèles : ${report.models.map((model) => `${model.model} ${formatUSD(model.costUSD)}`).join(' · ')}`)
  lines.push(`Projets : ${report.projectCosts.slice(0, 8).map((project) => `${project.projectName} ${formatUSD(project.costUSD)} (${project.sessions} sessions)`).join(' · ')}`)
  lines.push('', '## Constats détectés automatiquement')
  for (const finding of report.findings) {
    lines.push('', `### ${finding.title} — impact ${formatUSD(finding.impactUSD)} (${finding.severity})`, finding.summary)
    for (const evidence of finding.evidence.slice(0, EVIDENCE_PER_FINDING)) {
      lines.push(`- ${evidence.label} — ${evidence.value}${evidence.detail ? ` (${evidence.detail})` : ''}`)
    }
  }
  lines.push('', '## Outils les plus coûteux (résultats gardés en contexte)')
  for (const tool of report.tools.slice(0, 12)) {
    lines.push(`- ${tool.name} : ${tool.calls} appels, ${formatTokens(tool.resultTokens)} tokens de résultats, ${formatUSD(tool.costUSD)}, ${tool.errors} erreurs`)
  }
  lines.push('', '## Sessions les plus chères')
  for (const session of [...report.sessions].sort((left, right) => right.costUSD - left.costUSD).slice(0, 10)) {
    lines.push(
      `- « ${session.title} » (${session.projectName}) : ${formatUSD(session.costUSD)}, ${session.requests} requêtes, ${session.userPrompts} messages, contexte moyen ${formatTokens(session.averageContextTokens)}, pic ${formatTokens(session.peakContextTokens)}, sous-agents ${formatUSD(session.subagentCostUSD)}`,
    )
  }
  return lines.join('\n')
}
