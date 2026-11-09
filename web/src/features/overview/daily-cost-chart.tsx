import type { ChangeMarker } from '@claude-token-audit/server/marker-types'
import type { AuditReport } from '@claude-token-audit/server/report-types'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartTooltipRow } from '@/components/chart-tooltip-row'
import type { ChartConfig } from '@/components/ui/chart'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatDay, formatUSD } from '@/lib/format'

const MAX_MODEL_SERIES = 4
const OTHER_MODELS_KEY = 'other'

type DailyCostChartProps = {
  report: AuditReport
  markers: ChangeMarker[]
}

function localDay(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function seriesKey(index: number): string {
  return `model${index}`
}

export function DailyCostChart({ report, markers }: DailyCostChartProps) {
  const { rows, config, keys } = useMemo(() => {
    const models = report.models.map((model) => model.model)
    const kept = models.slice(0, MAX_MODEL_SERIES)
    const folded = models.slice(MAX_MODEL_SERIES)
    const chartConfig: ChartConfig = {}
    kept.forEach((model, index) => {
      chartConfig[seriesKey(index)] = { label: model, color: `var(--chart-${index + 1})` }
    })
    if (folded.length > 0) chartConfig[OTHER_MODELS_KEY] = { label: 'Autres modèles', color: 'var(--chart-5)' }
    const chartRows = report.dailyCosts.map((day) => {
      const row: Record<string, string | number> = { day: day.day }
      kept.forEach((model, index) => {
        row[seriesKey(index)] = day.costByModel[model] ?? 0
      })
      if (folded.length > 0) row[OTHER_MODELS_KEY] = folded.reduce((total, model) => total + (day.costByModel[model] ?? 0), 0)
      return row
    })
    return { rows: chartRows, config: chartConfig, keys: Object.keys(chartConfig) }
  }, [report])
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={rows} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={formatDay} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(value: number) => `$${Math.round(value)}`} />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)' }}
          content={<ChartTooltipContent labelFormatter={(value) => formatDay(String(value))} formatter={(value, name) => <ChartTooltipRow label={config[String(name)]?.label} color={config[String(name)]?.color} value={formatUSD(Number(value))} />} />}
        />
        {markers
          .filter((marker) => report.filter.project === null || marker.project === null || marker.project === report.filter.project)
          .map((marker) => ({ marker, day: localDay(marker.at) }))
          .filter(({ day }) => rows.some((row) => row['day'] === day))
          .map(({ marker, day }) => (
            <ReferenceLine key={marker.id} x={day} stroke="var(--foreground)" strokeDasharray="4 3" label={{ value: marker.label.slice(0, 28), position: 'insideTopLeft', fontSize: 11, fill: 'var(--muted-foreground)' }} />
          ))}
        {keys.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {keys.map((key, index) => (
          <Bar key={key} dataKey={key} stackId="cost" fill={`var(--color-${key})`} radius={index === keys.length - 1 ? [4, 4, 0, 0] : 0} stroke="var(--background)" strokeWidth={1} />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

