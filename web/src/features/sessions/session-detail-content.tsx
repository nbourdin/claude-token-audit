import type { SessionDetail } from '@claude-token-audit/server/session-detail-types'
import { KpiTile } from '@/components/kpi-tile'
import { RankedBarList } from '@/components/ranked-bar-list'
import { SectionCard } from '@/components/section-card'
import { formatDuration, formatTokens, formatUSD } from '@/lib/format'
import { ContextTimelineChart } from './context-timeline-chart'
import { SessionToolCallsTable } from './session-tool-calls-table'

export function SessionDetailContent({ detail }: { detail: SessionDetail }) {
  const rebuildCostUSD = detail.cacheRebuilds.reduce((total, rebuild) => total + rebuild.extraCostUSD, 0)
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Coût" value={formatUSD(detail.costUSD)} hint={`${detail.timeline.length} requêtes · ${detail.mainModel}`} />
        <KpiTile label="Contexte moyen" value={formatTokens(detail.averageContextTokens)} hint={`pic ${formatTokens(detail.peakContextTokens)}`} />
        <KpiTile label="Contexte fixe" value={formatTokens(detail.baselineTokens)} hint="au premier appel" />
        <KpiTile label="Cache réécrit" value={formatUSD(rebuildCostUSD)} hint={`${detail.cacheRebuilds.length} fois · durée ${formatDuration((detail.endedAt - detail.startedAt) / 60_000)}`} />
      </div>
      <SectionCard title="Taille du contexte, requête après requête" description={`${detail.userPrompts.length} messages de ta part. Chaque point est relu en entier par la requête suivante.`}>
        <ContextTimelineChart timeline={detail.timeline} compactionsAt={detail.compactionsAt} />
      </SectionCard>
      {detail.contextSections.length > 0 && (
        <SectionCard title="Contexte fixe de cette session" description="Ce qui était chargé avant le premier message, en tokens">
          <RankedBarList
            formatValue={formatTokens}
            items={detail.contextSections.slice(0, 12).map((section) => ({
              key: `${section.kind}-${section.label}`,
              label: section.label,
              value: section.tokens,
              details: [{ label: 'Tokens', value: formatTokens(section.tokens) }],
            }))}
          />
        </SectionCard>
      )}
      {detail.subagentRuns.length > 0 && (
        <SectionCard title="Sous-agents" description="Chaque sous-agent a son propre contexte ; seul son rapport revient ici.">
          <RankedBarList
            formatValue={formatUSD}
            items={detail.subagentRuns.map((run) => ({
              key: run.threadId,
              label: `${run.agentType}${run.description ? ` · ${run.description}` : ''}`,
              value: run.costUSD,
              details: [
                { label: 'Requêtes', value: String(run.requests) },
                { label: 'Pic de contexte', value: formatTokens(run.peakContextTokens) },
              ],
            }))}
          />
        </SectionCard>
      )}
      <SectionCard title="Appels d’outils les plus coûteux" description={`Top ${detail.toolCalls.length} sur ${detail.toolCallCount} : taille du résultat × nombre de requêtes qui l’ont relu`}>
        <SessionToolCallsTable toolCalls={detail.toolCalls} />
      </SectionCard>
    </div>
  )
}
