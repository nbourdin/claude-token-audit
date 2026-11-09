import type { AuditReport } from '@claude-token-audit/server/report-types'
import { SectionCard } from '@/components/section-card'
import { formatUSD } from '@/lib/format'
import { FindingCard } from './finding-card'

type FindingsTabProps = {
  report: AuditReport
  onOpenSession: (sessionId: string) => void
}

export function FindingsTab({ report, onOpenSession }: FindingsTabProps) {
  if (report.findings.length === 0) return <p className="py-12 text-center text-muted-foreground">Aucun constat sur cette période.</p>
  const totalImpactUSD = report.findings.reduce((total, finding) => total + finding.impactUSD, 0)
  return (
    <div className="grid gap-4">
      <SectionCard
        title={`${report.findings.length} constats, classés par impact`}
        description={`Les impacts se recoupent en partie (un gros résultat d’outil gonfle aussi le contexte) : ne les additionne pas. Ordre de grandeur cumulé : ${formatUSD(totalImpactUSD)} sur ${formatUSD(report.totals.costUSD)}.`}
      />
      {report.findings.map((finding) => (
        <FindingCard key={finding.id} finding={finding} totalCostUSD={report.totals.costUSD} onOpenSession={onOpenSession} />
      ))}
    </div>
  )
}
