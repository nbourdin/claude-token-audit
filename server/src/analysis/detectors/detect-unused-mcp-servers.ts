import { formatTokens, formatUSD } from '../format.ts'
import type { Finding } from '../report-types.ts'
import { describeServer, mcpServerOf } from '../tool-server-name.ts'
import type { Detector } from './detector-context.ts'
import { fixedContextCostUSD, severityFor } from './detector-context.ts'

type ServerUsage = {
  server: string
  toolNames: Set<string>
  sessionsLoaded: number
  tokens: number
  costUSD: number
  calls: number
}

const RARELY_USED_CALLS_PER_SESSION = 0.05

export const detectUnusedMcpServers: Detector = ({ metrics, rates, totalCostUSD }) => {
  const servers = new Map<string, ServerUsage>()
  const usageFor = (server: string): ServerUsage => {
    const existing = servers.get(server)
    if (existing) return existing
    const created = { server, toolNames: new Set<string>(), sessionsLoaded: 0, tokens: 0, costUSD: 0, calls: 0 }
    servers.set(server, created)
    return created
  }
  for (const metric of metrics) {
    const charsByServer = new Map<string, number>()
    for (const item of [...metric.session.toolDefinitions, ...metric.session.deferredTools]) {
      const server = mcpServerOf(item.name)
      if (!server) continue
      charsByServer.set(server, (charsByServer.get(server) ?? 0) + item.chars)
      usageFor(server).toolNames.add(item.name)
    }
    for (const [server, chars] of charsByServer) {
      const usage = usageFor(server)
      const tokens = chars * metric.tokensPerSectionChar
      usage.sessionsLoaded += 1
      usage.tokens += tokens
      usage.costUSD += fixedContextCostUSD(tokens, metric, rates)
    }
    for (const toolCall of metric.toolCalls) {
      const server = mcpServerOf(toolCall.name)
      if (server) usageFor(server).calls += 1
    }
  }
  const wasteful = [...servers.values()]
    .filter((usage) => usage.sessionsLoaded > 0 && usage.calls / usage.sessionsLoaded < RARELY_USED_CALLS_PER_SESSION)
    .sort((left, right) => right.costUSD - left.costUSD)
  if (wasteful.length === 0) return null
  const impactUSD = wasteful.reduce((total, usage) => total + usage.costUSD, 0)
  const unusedCount = wasteful.filter((usage) => usage.calls === 0).length
  return {
    id: 'unused-mcp-servers',
    title: 'Serveurs MCP et connecteurs chargés mais (presque) jamais appelés',
    severity: severityFor(impactUSD, totalCostUSD),
    impactUSD,
    impactTokens: wasteful.reduce((total, usage) => total + usage.tokens / usage.sessionsLoaded, 0),
    summary: `${wasteful.length} serveurs (dont ${unusedCount} jamais appelés) injectent leurs outils dans chaque requête. Leur présence coûte ${formatUSD(impactUSD)} sur la période.`,
    recommendations: [
      'Connecteurs claude.ai (identifiants UUID) : désactive-les dans les réglages de connecteurs, ou par session, pour les projets où ils ne servent pas.',
      'Serveurs MCP locaux : retire-les du `.mcp.json` du projet ou liste-les dans `disabledMcpjsonServers` de `.claude/settings.local.json`.',
      'Garde ceux que tu utilises chaque semaine ; un serveur à 0 appel sur 30 jours est un coût pur.',
    ],
    evidence: wasteful.slice(0, 12).map((usage) => ({
      label: describeServer(usage.server, [...usage.toolNames]),
      value: `${formatTokens(usage.tokens / usage.sessionsLoaded)} tokens / requête`,
      detail: `${usage.calls} appels sur ${usage.sessionsLoaded} sessions · ${formatUSD(usage.costUSD)}`,
    })),
  } satisfies Finding
}
