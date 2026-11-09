import { formatTokens, formatUSD, groupBy, sum } from '../format.ts'
import type { Finding } from '../report-types.ts'
import type { CacheRebuildCause } from '../session-metrics.ts'
import type { Detector } from './detector-context.ts'
import { severityFor } from './detector-context.ts'

const CAUSE_LABELS: Record<CacheRebuildCause, string> = {
  'idle-expiry': 'Reprise après expiration du cache (pause > TTL)',
  compaction: 'Compaction (attendu)',
  'model-switch': 'Changement de modèle en cours de session',
  'tools-or-system-changed': 'Outils ou prompt système modifiés en cours de session',
  unexplained: 'Cause non identifiée',
}

const CAUSE_RECOMMENDATIONS: Record<CacheRebuildCause, string> = {
  'idle-expiry': 'Reprendre une grosse session après une longue pause réécrit tout son contexte : pour une nouvelle tâche, ouvre une nouvelle session (ou `/clear`) plutôt que de relancer l’ancienne.',
  compaction: 'Les compactions réécrivent le cache, c’est normal ; si elles sont fréquentes, la session est trop longue pour une seule tâche.',
  'model-switch': 'Changer de modèle (ou d’effort) au milieu d’une session invalide tout le cache : choisis le modèle au démarrage.',
  'tools-or-system-changed': 'Un serveur MCP qui se connecte tard, qui demande une ré-auth ou qui change sa liste d’outils invalide le cache : stabilise ou coupe ces serveurs.',
  unexplained: 'Cause non identifiée : regarde les sessions listées pour repérer ce qui a changé.',
}

export const detectCacheRebuilds: Detector = ({ metrics, totalCostUSD }) => {
  const rebuilds = metrics.flatMap((metric) => metric.cacheRebuilds.map((rebuild) => ({ ...rebuild, metric })))
  const avoidable = rebuilds.filter((rebuild) => rebuild.cause !== 'compaction')
  if (avoidable.length === 0) return null
  const impactUSD = sum(avoidable, (rebuild) => rebuild.extraCostUSD)
  const byCause = [...groupBy(avoidable, (rebuild) => rebuild.cause).entries()].sort(
    (left, right) => sum(right[1], (rebuild) => rebuild.extraCostUSD) - sum(left[1], (rebuild) => rebuild.extraCostUSD),
  )
  const worstSessions = [...groupBy(avoidable, (rebuild) => rebuild.metric.session.sessionId).values()]
    .sort((left, right) => sum(right, (rebuild) => rebuild.extraCostUSD) - sum(left, (rebuild) => rebuild.extraCostUSD))
    .slice(0, 6)
  return {
    id: 'cache-rebuilds',
    title: 'Cache de prompt réécrit en cours de session',
    severity: severityFor(impactUSD, totalCostUSD),
    impactUSD,
    impactTokens: sum(avoidable, (rebuild) => rebuild.tokens),
    summary: `${avoidable.length} requêtes ont réécrit tout leur contexte au lieu de le relire depuis le cache (écriture 20× plus chère qu’une lecture). Surcoût : ${formatUSD(impactUSD)}.`,
    recommendations: byCause.slice(0, 3).map(([cause]) => CAUSE_RECOMMENDATIONS[cause]),
    evidence: [
      ...byCause.map(([cause, items]) => ({
        label: CAUSE_LABELS[cause],
        value: `${items.length} réécritures`,
        detail: `${formatTokens(sum(items, (rebuild) => rebuild.tokens))} tokens · ${formatUSD(sum(items, (rebuild) => rebuild.extraCostUSD))}`,
      })),
      ...worstSessions.map((items) => ({
        label: items[0]!.metric.session.title,
        value: `${items.length} réécritures`,
        detail: `${formatUSD(sum(items, (rebuild) => rebuild.extraCostUSD))} · plus longue pause ${Math.round(Math.max(...items.map((rebuild) => rebuild.gapMinutes)))} min`,
        sessionId: items[0]!.metric.session.sessionId,
      })),
    ],
  } satisfies Finding
}
