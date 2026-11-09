import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type RankedBarItem = {
  key: string
  label: string
  value: number
  details: Array<{ label: string; value: string }>
}

type RankedBarListProps = {
  items: RankedBarItem[]
  formatValue: (value: number) => string
  onSelect?: (item: RankedBarItem) => void
}

export function RankedBarList({ items, formatValue, onSelect }: RankedBarListProps) {
  const maximum = Math.max(...items.map((item) => item.value), 0) || 1
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <Tooltip key={item.key}>
          <TooltipTrigger
            render={<div />}
            onClick={onSelect ? () => onSelect(item) : undefined}
            className={cn(
              'group grid grid-cols-[minmax(110px,36%)_1fr_64px] items-center gap-3 rounded-md px-1 py-0.5 text-sm',
              onSelect && 'cursor-pointer hover:bg-muted',
            )}
          >
            <span className="truncate text-muted-foreground group-hover:text-foreground">{item.label}</span>
            <span className="h-2.5">
              <span className="block h-full min-w-0.5 rounded-r bg-chart-1" style={{ width: `${(item.value / maximum) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums">{formatValue(item.value)}</span>
          </TooltipTrigger>
          <TooltipContent side="right" className="grid gap-1">
            <span className="font-medium">{item.label}</span>
            {item.details.map((detail) => (
              <span key={detail.label} className="flex justify-between gap-6">
                <span className="opacity-70">{detail.label}</span>
                <span className="tabular-nums">{detail.value}</span>
              </span>
            ))}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
