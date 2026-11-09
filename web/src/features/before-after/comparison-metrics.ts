import type { PeriodMetrics } from '@claude-token-audit/server/comparison-types'
import { formatPercent, formatTokens, formatUSD } from '@/lib/format'

export type ComparisonMetric = {
  key: keyof PeriodMetrics
  label: string
  hint: string
  format: (value: number) => string
  isLowerBetter: boolean
}

export const OUTCOME_METRICS: ComparisonMetric[] = [
  { key: 'costPerPromptUSD', label: 'Coût par message', hint: 'L’indicateur principal : ce que coûte chacun de tes messages', format: formatUSD, isLowerBetter: true },
  { key: 'averageContextTokens', label: 'Contexte moyen par requête', hint: 'Ce qui est relu à chaque requête', format: formatTokens, isLowerBetter: true },
  { key: 'averageBaselineTokens', label: 'Contexte fixe au démarrage', hint: 'Outils, skills, MCP, CLAUDE.md, mémoire', format: formatTokens, isLowerBetter: true },
  { key: 'cacheRebuildCostPerSessionUSD', label: 'Cache réécrit par session', hint: 'Reprises après pause, changements de modèle ou d’outils', format: formatUSD, isLowerBetter: true },
  { key: 'largeToolResultCostPerSessionUSD', label: 'Gros résultats d’outils par session', hint: 'Résultats > 5k tokens traînés dans le contexte', format: formatUSD, isLowerBetter: true },
  { key: 'toolErrorRate', label: 'Taux d’échec des outils', hint: 'Chaque échec coûte un aller-retour', format: formatPercent, isLowerBetter: true },
  { key: 'cacheHitRatio', label: 'Lu depuis le cache', hint: 'Plus c’est haut, mieux c’est', format: formatPercent, isLowerBetter: false },
]

export const VOLUME_METRICS: ComparisonMetric[] = [
  { key: 'sessions', label: 'Sessions', hint: 'Volume d’activité, pour situer', format: (value) => String(value), isLowerBetter: false },
  { key: 'userPrompts', label: 'Messages', hint: 'Volume d’activité, pour situer', format: (value) => String(value), isLowerBetter: false },
  { key: 'costUSD', label: 'Coût total', hint: 'Dépend du volume : à lire avec le coût par message', format: formatUSD, isLowerBetter: true },
]
