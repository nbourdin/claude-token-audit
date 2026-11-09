import type { ReactNode } from 'react'

type ChartTooltipRowProps = {
  label: ReactNode
  color: string | undefined
  value: string
}

export function ChartTooltipRow({ label, color, value }: ChartTooltipRowProps) {
  return (
    <div className="flex w-full items-center gap-2">
      <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono font-medium tabular-nums">{value}</span>
    </div>
  )
}
