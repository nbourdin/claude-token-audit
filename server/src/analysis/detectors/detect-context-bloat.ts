import { cacheReadCostUSD } from '../../cost/request-cost.ts'
import { formatTokens, formatUSD, sum } from '../format.ts'
import type { Finding } from '../report-types.ts'
import type { Detector } from './detector-context.ts'
import { severityFor } from './detector-context.ts'

const COMFORTABLE_CONTEXT_TOKENS = 80_000
const BLOATED_AVERAGE_CONTEXT_TOKENS = 130_000
const MINIMUM_REQUESTS = 30

export const detectContextBloat: Detector = ({ metrics, rates, totalCostUSD }) => {
  const bloated = metrics
    .filter((metric) => metric.mainRequests.length >= MINIMUM_REQUESTS && metric.averageContextTokens >= BLOATED_AVERAGE_CONTEXT_TOKENS)
    .map((metric) => ({
      metric,
      excessUSD: sum(metric.mainRequests, (request) =>
        cacheReadCostUSD(Math.max(0, request.contextTokens - COMFORTABLE_CONTEXT_TOKENS), request.model, rates),
      ),
    }))
    .sort((left, right) => right.excessUSD - left.excessUSD)
  if (bloated.length === 0) return null
  const impactUSD = sum(bloated, (item) => item.excessUSD)
  const multiTask = bloated.filter((item) => item.metric.session.userPrompts.length >= 12).length
  return {
    id: 'context-bloat',
    title: 'Sessions qui tournent avec un contexte très chargé',
    severity: severityFor(impactUSD, totalCostUSD),
    impactUSD,
    impactTokens: sum(bloated, (item) => item.metric.averageContextTokens) / bloated.length,
    summary: `${bloated.length} sessions ont tourné avec plus de ${formatTokens(BLOATED_AVERAGE_CONTEXT_TOKENS)} tokens de contexte en moyenne (${multiTask} avec 12 messages ou plus de ta part). Tout ce qui dépasse ${formatTokens(COMFORTABLE_CONTEXT_TOKENS)} tokens est relu à chaque requête : ${formatUSD(impactUSD)}.`,
    recommendations: [
      'Une tâche = une session : `/clear` (ou nouvelle session) dès que tu changes de sujet ; le contexte de la tâche précédente n’aide plus.',
      'Délègue les explorations larges (lire 15 fichiers pour en comprendre 2) à un sous-agent : seule sa conclusion entre dans ton contexte.',
      'Sur une longue tâche, `/compact` avec une consigne de ce qu’il faut garder, avant que le contexte dépasse 150k.',
    ],
    evidence: bloated.slice(0, 10).map((item) => ({
      label: item.metric.session.title,
      value: `moyenne ${formatTokens(item.metric.averageContextTokens)} · pic ${formatTokens(item.metric.peakContextTokens)}`,
      detail: `${item.metric.mainRequests.length} requêtes · ${item.metric.session.userPrompts.length} messages · excès ${formatUSD(item.excessUSD)}`,
      sessionId: item.metric.session.sessionId,
    })),
  } satisfies Finding
}
