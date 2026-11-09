import type { Finding } from '@claude-token-audit/server/report-types'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { InlineCodeText } from '@/components/inline-code-text'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPercent, formatUSD } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EvidenceTable } from './evidence-table'
import { SeverityBadge } from './severity-badge'

type FindingCardProps = {
  finding: Finding
  totalCostUSD: number
  onOpenSession: (sessionId: string) => void
}

export function FindingCard({ finding, totalCostUSD, onOpenSession }: FindingCardProps) {
  const [isExpanded, setIsExpanded] = useState(finding.severity === 'high')
  return (
    <Card>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <SeverityBadge severity={finding.severity} />
            <h3 className="text-base font-semibold">{finding.title}</h3>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold tabular-nums">{finding.impactUSD > 0 ? formatUSD(finding.impactUSD) : '—'}</div>
            <div className="text-xs text-muted-foreground">
              {finding.impactUSD > 0 ? `${formatPercent(finding.impactUSD / Math.max(totalCostUSD, 1e-9))} du total` : 'information'}
            </div>
          </div>
        </div>
        <p className="text-muted-foreground">{finding.summary}</p>
        {finding.recommendations.length > 0 && (
          <ul className="grid list-disc gap-1 pl-5">
            {finding.recommendations.map((recommendation) => (
              <li key={recommendation}>
                <InlineCodeText text={recommendation} />
              </li>
            ))}
          </ul>
        )}
        <div>
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setIsExpanded((current) => !current)}>
            <ChevronDown className={cn('transition-transform', isExpanded && 'rotate-180')} />
            Détail ({finding.evidence.length})
          </Button>
          {isExpanded && <EvidenceTable evidence={finding.evidence} onOpenSession={onOpenSession} />}
        </div>
      </CardContent>
    </Card>
  )
}
