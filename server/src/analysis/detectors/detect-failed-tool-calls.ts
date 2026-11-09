import { formatPercent, formatUSD, groupBy, sum } from '../format.ts'
import type { Finding } from '../report-types.ts'
import { toolCallGroup } from '../tool-call-group.ts'
import type { Detector } from './detector-context.ts'
import { severityFor } from './detector-context.ts'

const MINIMUM_ERRORS_PER_GROUP = 3

export const detectFailedToolCalls: Detector = ({ metrics, totalCostUSD }) => {
  const failures = metrics.flatMap((metric) => {
    const averageRequestUSD = metric.mainRequests.length > 0 ? metric.costUSD / metric.session.requests.length : 0
    return metric.toolCalls.filter((toolCall) => toolCall.isError).map((toolCall) => ({ toolCall, metric, retryUSD: averageRequestUSD }))
  })
  const totalCalls = sum(metrics, (metric) => metric.toolCalls.length)
  if (failures.length === 0) return null
  const groups = [...groupBy(failures, (failure) => toolCallGroup(failure.toolCall.name, failure.toolCall.target)).entries()]
    .filter(([, items]) => items.length >= MINIMUM_ERRORS_PER_GROUP)
    .map(([group, items]) => ({ group, items, costUSD: sum(items, (item) => item.retryUSD) }))
    .sort((left, right) => right.costUSD - left.costUSD)
  const impactUSD = sum(failures, (failure) => failure.retryUSD)
  return {
    id: 'failed-tool-calls',
    title: 'Appels d’outils en échec (un aller-retour modèle chacun)',
    severity: severityFor(impactUSD, totalCostUSD),
    impactUSD,
    impactTokens: 0,
    summary: `${failures.length} appels d’outils ont échoué (${formatPercent(failures.length / Math.max(totalCalls, 1))} des appels). Chacun coûte au moins une requête de plus pour corriger le tir : ~${formatUSD(impactUSD)}.`,
    recommendations: [
      'Erreurs répétées sur la même commande : documente la bonne invocation (chemin, PATH, flags) dans le CLAUDE.md du projet ou en mémoire.',
      'Refus de permission récurrents : ajoute les commandes sûres à l’allowlist (`/fewer-permission-prompts`).',
    ],
    evidence: groups.slice(0, 10).map(({ group, items, costUSD }) => ({
      label: group,
      value: `${items.length} échecs`,
      detail: `${formatUSD(costUSD)} · ex. ${items[0]!.toolCall.target.slice(0, 80)}`,
      sessionId: items[0]!.metric.session.sessionId,
    })),
  } satisfies Finding
}
