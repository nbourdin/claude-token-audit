import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const NEGLIGIBLE_CHANGE = 0.03

type MetricDeltaProps = {
  before: number
  after: number
  isLowerBetter: boolean
  isNeutral?: boolean
}

export function MetricDelta({ before, after, isLowerBetter, isNeutral = false }: MetricDeltaProps) {
  if (before === 0 && after === 0) return <span className="text-muted-foreground">—</span>
  const change = before === 0 ? 1 : (after - before) / before
  const isNegligible = Math.abs(change) < NEGLIGIBLE_CHANGE
  const isImprovement = isLowerBetter ? change < 0 : change > 0
  const Icon = isNegligible ? Minus : change < 0 ? ArrowDownRight : ArrowUpRight
  const tone = isNeutral || isNegligible ? 'text-muted-foreground' : isImprovement ? 'text-status-good' : 'text-status-critical'
  const verdict = isNeutral || isNegligible ? 'stable' : isImprovement ? 'mieux' : 'moins bien'
  return (
    <span className={cn('inline-flex items-center justify-end gap-1 font-medium tabular-nums', tone)}>
      <Icon className="size-3.5" />
      {change > 0 ? '+' : ''}
      {(change * 100).toFixed(0)} %<span className="sr-only"> ({verdict})</span>
    </span>
  )
}
