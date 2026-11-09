import type { PeriodMetrics } from '@claude-token-audit/server/comparison-types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ComparisonMetric } from './comparison-metrics'
import { MetricDelta } from './metric-delta'

type ComparisonMetricsTableProps = {
  metrics: ComparisonMetric[]
  before: PeriodMetrics
  after: PeriodMetrics
  isNeutral?: boolean
}

export function ComparisonMetricsTable({ metrics, before, after, isNeutral = false }: ComparisonMetricsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Indicateur</TableHead>
          <TableHead className="text-right">Avant</TableHead>
          <TableHead className="text-right">Après</TableHead>
          <TableHead className="text-right">Évolution</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {metrics.map((metric) => (
          <TableRow key={metric.key}>
            <TableCell>
              <div className="grid">
                <span>{metric.label}</span>
                <span className="text-xs text-muted-foreground">{metric.hint}</span>
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">{metric.format(before[metric.key])}</TableCell>
            <TableCell className="text-right tabular-nums">{metric.format(after[metric.key])}</TableCell>
            <TableCell className="text-right">
              <MetricDelta before={before[metric.key]} after={after[metric.key]} isLowerBetter={metric.isLowerBetter} isNeutral={isNeutral} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
