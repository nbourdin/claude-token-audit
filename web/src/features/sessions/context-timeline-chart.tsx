import type { TimelinePoint } from '@claude-token-audit/server/session-detail-types'
import { useMemo } from 'react'
import { Area, CartesianGrid, ComposedChart, ReferenceLine, Scatter, XAxis, YAxis } from 'recharts'
import { ChartTooltipRow } from '@/components/chart-tooltip-row'
import type { ChartConfig } from '@/components/ui/chart'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatDateTime, formatTokens, formatUSD } from '@/lib/format'

const REBUILD_MINIMUM_TOKENS = 20_000

const chartConfig = {
  contextTokens: { label: 'Contexte', color: 'var(--chart-1)' },
  rebuild: { label: 'Cache réécrit', color: 'var(--chart-2)' },
} satisfies ChartConfig

type ContextTimelineChartProps = {
  timeline: TimelinePoint[]
  compactionsAt: number[]
}

export function ContextTimelineChart({ timeline, compactionsAt }: ContextTimelineChartProps) {
  const rows = useMemo(
    () =>
      timeline.map((point, index) => ({
        ...point,
        requestNumber: index + 1,
        rebuild: point.cacheWriteTokens >= REBUILD_MINIMUM_TOKENS && point.cacheWriteTokens >= point.contextTokens * 0.5 && index > 0 ? point.contextTokens : null,
      })),
    [timeline],
  )
  const compactionRequests = compactionsAt.map((at) => rows.find((row) => row.at >= at)?.requestNumber).filter((value) => value !== undefined)
  return (
    <div className="grid gap-2">
      <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
        <ComposedChart data={rows} margin={{ left: 4, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="requestNumber" tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(value: number) => formatTokens(value)} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_, payload) => {
                  const point = payload[0]?.payload
                  return point ? `Requête ${point.requestNumber} · ${formatDateTime(point.at)}` : ''
                }}
                formatter={(_, name, item) => {
                  if (name !== 'contextTokens') return null
                  const point = item.payload
                  return (
                    <div className="grid w-full gap-0.5">
                      <ChartTooltipRow label="Contexte" color="var(--chart-1)" value={formatTokens(point.contextTokens)} />
                      <ChartTooltipRow label="Écrit en cache" color="var(--chart-2)" value={formatTokens(point.cacheWriteTokens)} />
                      <ChartTooltipRow label="Sortie" color={undefined} value={formatTokens(point.outputTokens)} />
                      <ChartTooltipRow label="Coût" color={undefined} value={formatUSD(point.costUSD)} />
                    </div>
                  )
                }}
              />
            }
          />
          {compactionRequests.map((requestNumber) => (
            <ReferenceLine key={requestNumber} x={requestNumber} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
          ))}
          <Area dataKey="contextTokens" type="monotone" stroke="var(--color-contextTokens)" fill="var(--color-contextTokens)" fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
          <Scatter dataKey="rebuild" fill="var(--color-rebuild)" stroke="var(--background)" strokeWidth={2} isAnimationActive={false} />
        </ComposedChart>
      </ChartContainer>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-chart-1" /> Taille du contexte à chaque requête
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-chart-2" /> Cache réécrit (contexte repayé au prix fort)
        </span>
        {compactionRequests.length > 0 && <span>┆ Compaction</span>}
      </div>
    </div>
  )
}
