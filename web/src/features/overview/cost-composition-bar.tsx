import type { AuditReport } from '@claude-token-audit/server/report-types'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatPercent, formatUSD } from '@/lib/format'

type CostCompositionBarProps = {
  composition: AuditReport['costComposition']
}

export function CostCompositionBar({ composition }: CostCompositionBarProps) {
  const parts = [
    { label: 'Relecture du cache', value: composition.cacheRead, color: 'var(--chart-1)' },
    { label: 'Écriture du cache', value: composition.cacheWrite, color: 'var(--chart-2)' },
    { label: 'Sortie (dont réflexion)', value: composition.output, color: 'var(--chart-3)' },
    { label: 'Entrée non cachée', value: composition.input, color: 'var(--chart-4)' },
  ]
  const total = composition.total || 1
  return (
    <div className="grid gap-3">
      <div className="flex h-4 gap-0.5 overflow-hidden rounded">
        {parts.map((part) => (
          <Tooltip key={part.label}>
            <TooltipTrigger render={<div />} className="min-w-0.5" style={{ flex: `${part.value / total} 0 0`, background: part.color }} />
            <TooltipContent>
              {part.label} : {formatUSD(part.value)} ({formatPercent(part.value / total)})
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {parts.map((part) => (
          <span key={part.label} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ background: part.color }} />
            {part.label} · <span className="font-medium text-foreground tabular-nums">{formatPercent(part.value / total)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
