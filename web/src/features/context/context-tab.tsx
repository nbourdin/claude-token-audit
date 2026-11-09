import type { AuditReport, BaselineSectionAggregate } from '@claude-token-audit/server/report-types'
import { RankedBarList } from '@/components/ranked-bar-list'
import { SectionCard } from '@/components/section-card'
import { formatTokens, formatUSD } from '@/lib/format'
import { ModelPricesTable } from './model-prices-table'
import { ToolsTable } from './tools-table'

const KIND_LABELS: Record<BaselineSectionAggregate['kind'], string> = {
  'core-prompt': 'Prompt Claude Code',
  'tool-definitions': 'Définitions d’outils',
  'project-instructions': 'CLAUDE.md',
  memory: 'Mémoire',
  skills: 'Skills',
  'mcp-instructions': 'Instructions MCP',
  'deferred-tools': 'Outils différés',
  'session-context': 'Contexte de session',
}

const MCP_PREFIX_PATTERN = /^mcp__.+?__/

export function ContextTab({ report }: { report: AuditReport }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Contexte fixe, par bloc" description="Chargé avant ton premier message, en tokens par requête (moyenne). Survole pour le coût cumulé.">
          <RankedBarList
            formatValue={formatTokens}
            items={report.baselineSections.slice(0, 14).map((section) => ({
              key: `${section.kind}-${section.label}`,
              label: section.label,
              value: section.averageTokens,
              details: [
                { label: 'Type', value: KIND_LABELS[section.kind] },
                { label: 'Coût cumulé', value: formatUSD(section.costUSD) },
                { label: 'Sessions', value: String(section.sessions) },
              ],
            }))}
          />
        </SectionCard>
        <SectionCard title="Outils qui remplissent le contexte" description="Résultats écrits une fois, puis relus à chaque requête suivante">
          <RankedBarList
            formatValue={formatUSD}
            items={report.tools.slice(0, 14).map((tool) => ({
              key: tool.name,
              label: tool.name.replace(MCP_PREFIX_PATTERN, 'mcp:'),
              value: tool.costUSD,
              details: [
                { label: 'Appels', value: String(tool.calls) },
                { label: 'Tokens de résultats', value: formatTokens(tool.resultTokens) },
                { label: 'Tokens relus', value: formatTokens(tool.carriedTokens) },
                { label: 'Erreurs', value: String(tool.errors) },
              ],
            }))}
          />
        </SectionCard>
      </div>
      <SectionCard title="Détail par outil" description="Tokens de résultats et relectures cumulées sur la période">
        <ToolsTable tools={report.tools} />
      </SectionCard>
      <SectionCard
        title="Prix utilisés"
        description="Prix d’entrée par million de tokens, calibré sur les coûts enregistrés par Claude Code. Cache : écriture ×1,25 (5 min) ou ×2 (1 h), lecture ×0,1 ; sortie ×5."
      >
        <ModelPricesTable models={report.models} />
      </SectionCard>
    </div>
  )
}
