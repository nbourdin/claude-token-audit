import type { AppliedActionView } from '@claude-token-audit/server/action-types'
import { formatUSD } from '@/lib/format'

const MINIMUM_OBSERVATIONS_FOR_CONFIDENCE = 5

function observationLabel(count: number, unit: AppliedActionView['verification']['observedUnit']): string {
  const noun = unit === 'run' ? 'exécution' : 'session'
  return `${count} ${noun}${count > 1 ? 's' : ''}`
}

export function MeasuredSavingCell({ action }: { action: AppliedActionView }) {
  const { measuredMonthlySavingUSD, measuredOverDays, observed, observedUnit } = action.verification
  const estimate = `estimé ${formatUSD(action.estimatedMonthlySavingUSD)}`
  if (measuredMonthlySavingUSD === null || action.undoneAt !== null) {
    return (
      <div className="grid justify-items-end">
        <span className="text-muted-foreground">—</span>
        <span className="text-xs text-muted-foreground">{estimate}</span>
      </div>
    )
  }
  const isTentative = observed < MINIMUM_OBSERVATIONS_FOR_CONFIDENCE
  return (
    <div className="grid justify-items-end">
      <span className="tabular-nums">{formatUSD(measuredMonthlySavingUSD)} / mois</span>
      <span className="text-xs text-muted-foreground">
        {estimate} · {observationLabel(observed, observedUnit)} en {Math.max(1, Math.round(measuredOverDays))} j{isTentative ? ', à confirmer' : ''}
      </span>
    </div>
  )
}
