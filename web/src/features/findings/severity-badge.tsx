import type { FindingSeverity } from '@claude-token-audit/server/report-types'
import { AlertTriangle, CircleAlert, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const SEVERITY_DISPLAY: Record<FindingSeverity, { label: string; icon: typeof AlertTriangle; colorClass: string }> = {
  high: { label: 'Priorité haute', icon: AlertTriangle, colorClass: 'text-status-critical' },
  medium: { label: 'Priorité moyenne', icon: CircleAlert, colorClass: 'text-status-serious' },
  low: { label: 'À surveiller', icon: Eye, colorClass: 'text-muted-foreground' },
}

export function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  const { label, icon: Icon, colorClass } = SEVERITY_DISPLAY[severity]
  return (
    <Badge variant="outline" className="gap-1">
      <Icon className={colorClass} />
      {label}
    </Badge>
  )
}
