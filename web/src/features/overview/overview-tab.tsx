import type { ChangeMarker } from '@claude-token-audit/server/marker-types'
import type { AuditReport } from '@claude-token-audit/server/report-types'
import { ArrowRight } from 'lucide-react'
import { KpiTile } from '@/components/kpi-tile'
import { RankedBarList } from '@/components/ranked-bar-list'
import { SectionCard } from '@/components/section-card'
import { Button } from '@/components/ui/button'
import { formatPercent, formatTokens, formatUSD } from '@/lib/format'
import type { AppTab } from '@/app/app'
import { CostCompositionBar } from './cost-composition-bar'
import { DailyCostChart } from './daily-cost-chart'

type OverviewTabProps = {
  report: AuditReport
  markers: ChangeMarker[]
  onOpenTab: (tab: AppTab) => void
}

export function OverviewTab({ report, markers, onOpenTab }: OverviewTabProps) {
  const { totals } = report
  const topFinding = report.findings.find((finding) => finding.impactUSD > 0)
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiTile label="Coût (équivalent API)" value={formatUSD(totals.costUSD)} hint={`${totals.sessions} sessions · ${totals.requests.toLocaleString('fr-FR')} requêtes`} />
        <KpiTile label="Par message envoyé" value={formatUSD(totals.costPerUserPromptUSD)} hint={`${totals.userPrompts} messages de ta part`} />
        <KpiTile label="Contexte fixe au démarrage" value={formatTokens(totals.averageBaselineTokens)} hint="tokens avant ton premier mot" />
        <KpiTile label="Pic de contexte médian" value={formatTokens(totals.medianPeakContextTokens)} hint="par session" />
        <KpiTile label="Lu depuis le cache" value={formatPercent(totals.cacheHitRatio)} hint={`${formatTokens(totals.cacheReadTokens)} tokens relus`} />
      </div>
      {topFinding && (
        <SectionCard
          title={`Premier levier : ${topFinding.title}`}
          description={topFinding.summary}
          action={
            <Button variant="outline" size="sm" onClick={() => onOpenTab('findings')}>
              Les {report.findings.length} constats <ArrowRight />
            </Button>
          }
        />
      )}
      <SectionCard title="Coût par jour" description="Équivalent prix API, par modèle. Les lignes pointillées marquent les changements notés dans « Avant / après ».">
        <DailyCostChart report={report} markers={markers} />
      </SectionCard>
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Où part l’argent" description="La relecture du cache domine dès que le contexte est gros : chaque requête relit tout.">
          <CostCompositionBar composition={report.costComposition} />
        </SectionCard>
        <SectionCard title="Par projet" description="Coût cumulé sur la période">
          <RankedBarList
            formatValue={formatUSD}
            items={report.projectCosts.slice(0, 10).map((project) => ({
              key: project.projectName,
              label: project.projectName,
              value: project.costUSD,
              details: [
                { label: 'Coût', value: formatUSD(project.costUSD) },
                { label: 'Sessions', value: String(project.sessions) },
              ],
            }))}
          />
        </SectionCard>
      </div>
    </div>
  )
}
