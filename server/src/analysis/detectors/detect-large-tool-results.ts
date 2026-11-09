import { formatTokens, formatUSD, groupBy, sum } from '../format.ts'
import type { Finding } from '../report-types.ts'
import { toolCallGroup } from '../tool-call-group.ts'
import type { Detector } from './detector-context.ts'
import { severityFor } from './detector-context.ts'

const LARGE_RESULT_TOKENS = 5_000

const RECOMMENDATION_BY_TOOL: Array<{ pattern: RegExp; text: string }> = [
  { pattern: /^Read$/, text: 'Read de gros fichiers : demande à Claude de cibler (`offset`/`limit`, ou Grep d’abord) ; découpe les fichiers géants, ils coûtent à chaque lecture.' },
  { pattern: /^Bash/, text: 'Commandes bavardes (tests, typecheck, build, logs) : filtre la sortie (`| tail -40`, `--reporter=dot`, `--silent`, `grep -E "error|FAIL"`) ou fais-les tourner par un sous-agent qui ne renvoie que le verdict.' },
  { pattern: /^MCP/, text: 'Résultats MCP volumineux : demande des requêtes plus étroites (filtres, limites, champs) ; préfère `get_page_text`/`find` à des captures et arbres complets.' },
  { pattern: /^(Grep|Glob)$/, text: 'Recherches trop larges : restreins le chemin ou le glob, utilise `head_limit` / le mode `files_with_matches`.' },
  { pattern: /^(Agent|Task)$/, text: 'Sous-agents qui renvoient de longs rapports : demande-leur une conclusion courte, pas les extraits de fichiers.' },
]

export const detectLargeToolResults: Detector = ({ metrics, totalCostUSD }) => {
  const largeCalls = metrics.flatMap((metric) =>
    metric.toolCalls.filter((toolCall) => toolCall.resultTokens >= LARGE_RESULT_TOKENS).map((toolCall) => ({ ...toolCall, metric })),
  )
  if (largeCalls.length === 0) return null
  const impactUSD = sum(largeCalls, (toolCall) => toolCall.costUSD)
  const groups = [...groupBy(largeCalls, (toolCall) => toolCallGroup(toolCall.name, toolCall.target)).entries()]
    .map(([group, calls]) => ({ group, calls, costUSD: sum(calls, (toolCall) => toolCall.costUSD) }))
    .sort((left, right) => right.costUSD - left.costUSD)
  const topCalls = [...largeCalls].sort((left, right) => right.costUSD - left.costUSD).slice(0, 8)
  const recommendations = RECOMMENDATION_BY_TOOL.filter(({ pattern }) => groups.slice(0, 5).some(({ group }) => pattern.test(group))).map(({ text }) => text)
  return {
    id: 'large-tool-results',
    title: 'Résultats d’outils volumineux traînés dans le contexte',
    severity: severityFor(impactUSD, totalCostUSD),
    impactUSD,
    impactTokens: sum(largeCalls, (toolCall) => toolCall.carriedTokens),
    summary: `${largeCalls.length} résultats d’outils de plus de ${formatTokens(LARGE_RESULT_TOKENS)} tokens sont restés dans le contexte et ont été relus à chaque requête suivante : ${formatTokens(sum(largeCalls, (toolCall) => toolCall.carriedTokens))} tokens relus, ${formatUSD(impactUSD)}.`,
    recommendations,
    evidence: [
      ...groups.slice(0, 7).map(({ group, calls, costUSD }) => ({
        label: group,
        value: `${calls.length} appels · ${formatTokens(sum(calls, (toolCall) => toolCall.resultTokens) / calls.length)} tokens en moyenne`,
        detail: formatUSD(costUSD),
      })),
      ...topCalls.map((toolCall) => ({
        label: `${toolCall.name} ${toolCall.target}`.slice(0, 120),
        value: `${formatTokens(toolCall.resultTokens)} tokens × ${toolCall.carriedRequests} requêtes`,
        detail: `${formatUSD(toolCall.costUSD)} · ${toolCall.metric.session.title}`,
        sessionId: toolCall.metric.session.sessionId,
      })),
    ],
  } satisfies Finding
}
