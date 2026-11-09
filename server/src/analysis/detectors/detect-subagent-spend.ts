import { requestCostUSD } from '../../cost/request-cost.ts'
import { formatPercent, formatUSD, sum } from '../format.ts'
import type { Finding } from '../report-types.ts'
import type { Detector } from './detector-context.ts'

type AgentTypeSpend = {
  agentType: string
  runs: number
  costUSD: number
  requests: number
}

export const detectSubagentSpend: Detector = ({ metrics, rates, totalCostUSD }) => {
  const byType = new Map<string, AgentTypeSpend>()
  for (const metric of metrics) {
    const typeByThread = new Map(metric.session.subagents.map((subagent) => [subagent.threadId, subagent.agentType]))
    const seenThreads = new Set<string>()
    for (const request of metric.session.requests) {
      if (request.threadId === 'main') continue
      const agentType = typeByThread.get(request.threadId) ?? 'unknown'
      const spend = byType.get(agentType) ?? { agentType, runs: 0, costUSD: 0, requests: 0 }
      if (!seenThreads.has(request.threadId)) {
        seenThreads.add(request.threadId)
        spend.runs += 1
      }
      spend.costUSD += requestCostUSD(request, rates)
      spend.requests += 1
      byType.set(agentType, spend)
    }
  }
  const ranked = [...byType.values()].sort((left, right) => right.costUSD - left.costUSD)
  if (ranked.length === 0) return null
  const subagentCostUSD = sum(ranked, (spend) => spend.costUSD)
  return {
    id: 'subagent-spend',
    title: 'Dépense des sous-agents',
    severity: 'low',
    impactUSD: 0,
    impactTokens: 0,
    summary: `Les sous-agents représentent ${formatUSD(subagentCostUSD)} (${formatPercent(subagentCostUSD / Math.max(totalCostUSD, 1e-9))} du total). Ce n’est pas du gaspillage en soi : ils protègent le contexte principal. À surveiller si un type d’agent coûte cher par exécution.`,
    recommendations: [
      'Les agents d’exploration n’ont pas besoin du modèle le plus cher : fixe `model: sonnet` ou `haiku` dans le frontmatter des agents de recherche.',
      'Un agent qui coûte cher par exécution reçoit souvent un brief trop large : précise le périmètre et la forme attendue du résultat.',
    ],
    evidence: ranked.slice(0, 10).map((spend) => ({
      label: spend.agentType,
      value: `${spend.runs} exécutions · ${formatUSD(spend.costUSD / spend.runs)} / exécution`,
      detail: `${formatUSD(spend.costUSD)} · ${spend.requests} requêtes`,
    })),
  } satisfies Finding
}
