import type { ContextSectionKind } from '../../model/session-summary.ts'
import { formatPercent, formatTokens, formatUSD, sum } from '../format.ts'
import type { Finding, FindingEvidence } from '../report-types.ts'
import type { Detector } from './detector-context.ts'
import { fixedContextCostUSD, severityFor } from './detector-context.ts'

const RECOMMENDATION_BY_KIND: Partial<Record<ContextSectionKind, string>> = {
  'tool-definitions': 'Les définitions d’outils sont le plus gros poste : désactive dans chaque projet les serveurs MCP et connecteurs que tu n’y utilises pas (voir le constat MCP).',
  'deferred-tools': 'La liste des outils différés vient des connecteurs claude.ai et serveurs MCP : chaque connecteur actif ajoute des centaines de noms à chaque requête.',
  skills: 'La liste des skills est relue à chaque requête : désinstalle les packs que tu n’invoques jamais (voir le constat skills).',
  memory: 'L’index MEMORY.md est chargé dans chaque session : garde-le court (une ligne par entrée) et pousse le détail dans les fichiers liés.',
  'project-instructions': 'Les CLAUDE.md sont chargés à chaque session : déplace les règles spécifiques à un dossier dans des CLAUDE.md de sous-dossier.',
  'mcp-instructions': 'Les instructions des serveurs MCP sont injectées même quand le serveur ne sert pas : coupe les serveurs inutiles.',
}

export const detectBaselineOverhead: Detector = ({ metrics, rates, totalCostUSD }) => {
  const withSections = metrics.filter((metric) => metric.session.contextSections.length > 0 && metric.baselineTokens > 0)
  if (withSections.length === 0) return null
  const sectionTotals = new Map<string, { label: string; kind: ContextSectionKind; tokens: number; costUSD: number; sessions: number }>()
  let impactUSD = 0
  for (const metric of withSections) {
    impactUSD += fixedContextCostUSD(metric.baselineTokens, metric, rates)
    for (const section of metric.session.contextSections) {
      const tokens = section.chars * metric.tokensPerSectionChar
      const key = `${section.kind}:${section.label}`
      const total = sectionTotals.get(key) ?? { label: section.label, kind: section.kind, tokens: 0, costUSD: 0, sessions: 0 }
      total.tokens += tokens
      total.costUSD += fixedContextCostUSD(tokens, metric, rates)
      total.sessions += 1
      sectionTotals.set(key, total)
    }
  }
  const averageBaseline = sum(withSections, (metric) => metric.baselineTokens) / withSections.length
  const ranked = [...sectionTotals.values()].sort((left, right) => right.costUSD - left.costUSD)
  const evidence: FindingEvidence[] = ranked.slice(0, 10).map((section) => ({
    label: section.label,
    value: `${formatTokens(section.tokens / section.sessions)} tokens / requête`,
    detail: `${formatUSD(section.costUSD)} sur ${section.sessions} sessions`,
  }))
  const recommendations = [...new Set(ranked.slice(0, 6).flatMap((section) => RECOMMENDATION_BY_KIND[section.kind] ?? []))]
  return {
    id: 'baseline-overhead',
    title: 'Contexte fixe chargé avant le premier mot',
    severity: severityFor(impactUSD, totalCostUSD),
    impactUSD,
    impactTokens: averageBaseline,
    summary: `Chaque session démarre avec ~${formatTokens(averageBaseline)} tokens de prompt système, outils, skills et mémoire, relus à chaque requête. Sur la période, ce socle coûte ${formatUSD(impactUSD)} (${formatPercent(impactUSD / Math.max(totalCostUSD, 1e-9))} du total).`,
    recommendations,
    evidence,
  } satisfies Finding
}
