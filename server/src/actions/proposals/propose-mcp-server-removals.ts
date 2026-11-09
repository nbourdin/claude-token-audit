import { fixedContextCostUSD } from '../../analysis/detectors/detector-context.ts'
import { mcpServerOf } from '../../analysis/tool-server-name.ts'
import { config } from '../../config.ts'
import { asRecord } from '../../transcripts/json-access.ts'
import type { ProposedAction } from '../action-types.ts'
import { readJsonRecord } from '../json-file.ts'
import type { ProposalContext } from './proposal-context.ts'

export function proposeMcpServerRemovals({ allSessions, recentMetrics, rates }: ProposalContext): ProposedAction[] {
  const configuredServers = Object.keys(asRecord(readJsonRecord(config.claudeJsonPath)['mcpServers']) ?? {})
  const calledServers = new Set(allSessions.flatMap((session) => session.toolCalls.map((call) => mcpServerOf(call.name)).filter((server) => server !== null)))
  return configuredServers
    .filter((server) => !calledServers.has(server))
    .map((server) => {
      let monthlyCostUSD = 0
      let sessionsLoaded = 0
      for (const metric of recentMetrics) {
        const chars = [...metric.session.toolDefinitions, ...metric.session.deferredTools]
          .filter((item) => mcpServerOf(item.name) === server)
          .reduce((total, item) => total + item.chars, 0)
        if (chars === 0) continue
        sessionsLoaded += 1
        monthlyCostUSD += fixedContextCostUSD(chars * metric.tokensPerSectionChar, metric, rates)
      }
      return {
        key: `disable-mcp-server:${server}`,
        findingId: 'unused-mcp-servers',
        title: `Retirer le serveur MCP « ${server} »`,
        rationale:
          sessionsLoaded > 0
            ? `0 appel sur tout l’historique, chargé dans ${sessionsLoaded} sessions ces 30 derniers jours.`
            : '0 appel sur tout l’historique, et il échoue à se connecter à chaque démarrage de session.',
        changes: [{ target: '~/.claude.json → mcpServers', description: `retire « ${server} » (sa config est gardée dans le journal d’actions)` }],
        estimatedMonthlySavingUSD: monthlyCostUSD,
        project: null,
        caveat: 'S’applique à tous les projets, à partir des prochaines sessions. Annuler remet la config exacte.',
        payload: { kind: 'disable-mcp-server', serverName: server },
        verification: { kind: 'footprint', footprint: { kind: 'mcp-server', serverName: server }, label: `outils du serveur « ${server} »` },
      }
    })
}
