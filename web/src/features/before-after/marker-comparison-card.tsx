import type { MarkerComparison } from '@claude-token-audit/server/comparison-types'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDeleteMarkerMutation } from '@/hooks/use-delete-marker-mutation'
import { formatDateTime } from '@/lib/format'
import { OUTCOME_METRICS, VOLUME_METRICS } from './comparison-metrics'
import { ComparisonMetricsTable } from './comparison-metrics-table'

export function MarkerComparisonCard({ comparison }: { comparison: MarkerComparison }) {
  const deleteMarker = useDeleteMarkerMutation()
  const { marker, before, after, windowDays, afterDaysElapsed, hasEnoughData } = comparison
  const isAfterPartial = afterDaysElapsed < windowDays - 0.05
  return (
    <Card>
      <CardHeader>
        <CardTitle>{marker.label}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span>{formatDateTime(marker.at)}</span>
          <Badge variant="outline">{marker.project ?? 'tous les projets'}</Badge>
          <span>
            {windowDays} j avant ({before.sessions} sessions) · {isAfterPartial ? `${afterDaysElapsed.toFixed(1)} j` : `${windowDays} j`} après ({after.sessions} sessions)
          </span>
          {isAfterPartial && <Badge variant="secondary">période après en cours</Badge>}
          {!hasEnoughData && <Badge variant="secondary">peu de données, à confirmer</Badge>}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="Supprimer ce changement" onClick={() => deleteMarker.mutate(marker.id)} disabled={deleteMarker.isPending}>
            <Trash2 />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ComparisonMetricsTable metrics={OUTCOME_METRICS} before={before} after={after} />
        <details>
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">Volume d’activité</summary>
          <ComparisonMetricsTable metrics={VOLUME_METRICS} before={before} after={after} isNeutral />
        </details>
      </CardContent>
    </Card>
  )
}
