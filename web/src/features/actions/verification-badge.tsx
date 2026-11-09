import type { VerificationStatus } from '@claude-token-audit/server/action-types'
import { CircleCheck, CircleDashed, CircleX, Clock, TriangleAlert, Undo2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const STATUS_DISPLAY: Record<VerificationStatus, { label: string; icon: typeof CircleCheck; colorClass: string }> = {
  effective: { label: 'Vérifiée', icon: CircleCheck, colorClass: 'text-status-good' },
  'in-place': { label: 'En place', icon: CircleCheck, colorClass: 'text-status-good' },
  partial: { label: 'Effet partiel', icon: TriangleAlert, colorClass: 'text-status-serious' },
  ineffective: { label: 'Sans effet', icon: CircleX, colorClass: 'text-status-critical' },
  missing: { label: 'Retirée à la main', icon: CircleX, colorClass: 'text-status-critical' },
  waiting: { label: 'En attente', icon: Clock, colorClass: 'text-muted-foreground' },
  'not-verifiable': { label: 'Non vérifiable', icon: CircleDashed, colorClass: 'text-muted-foreground' },
  undone: { label: 'Annulée', icon: Undo2, colorClass: 'text-muted-foreground' },
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { label, icon: Icon, colorClass } = STATUS_DISPLAY[status]
  return (
    <Badge variant="outline" className="gap-1">
      <Icon className={colorClass} />
      {label}
    </Badge>
  )
}
