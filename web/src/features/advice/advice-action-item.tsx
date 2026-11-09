import type { AdviceAction } from '@claude-token-audit/server/advice-types'
import { InlineCodeText } from '@/components/inline-code-text'
import { Badge } from '@/components/ui/badge'
import { formatUSD } from '@/lib/format'

const EFFORT_LABELS: Record<AdviceAction['effort'], string> = { S: 'effort faible', M: 'effort moyen', L: 'effort important' }

export function AdviceActionItem({ action, rank }: { action: AdviceAction; rank: number }) {
  return (
    <li className="grid gap-1.5 border-t py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm text-muted-foreground tabular-nums">{rank}.</span>
        <h3 className="font-semibold">{action.title}</h3>
        <Badge variant="secondary">{EFFORT_LABELS[action.effort]}</Badge>
        {action.estimatedMonthlySavingUSD > 0 && (
          <span className="ml-auto text-sm font-semibold text-status-good tabular-nums">≈ {formatUSD(action.estimatedMonthlySavingUSD)} / mois</span>
        )}
      </div>
      <p className="text-muted-foreground">
        <InlineCodeText text={action.why} />
      </p>
      <ol className="grid list-decimal gap-1 pl-5">
        {action.steps.map((step) => (
          <li key={step}>
            <InlineCodeText text={step} />
          </li>
        ))}
      </ol>
    </li>
  )
}
