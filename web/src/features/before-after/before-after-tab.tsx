import type { ReportFilter } from '@claude-token-audit/server/report-types'
import { useState } from 'react'
import { SectionCard } from '@/components/section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useMarkerComparisonsQuery } from '@/hooks/use-marker-comparisons-query'
import { MarkerComparisonCard } from './marker-comparison-card'
import { NewMarkerForm } from './new-marker-form'

const WINDOW_OPTIONS = ['7', '14', '30']

type BeforeAfterTabProps = {
  filter: ReportFilter
  projects: string[]
  labelSuggestions: string[]
}

export function BeforeAfterTab({ filter, projects, labelSuggestions }: BeforeAfterTabProps) {
  const [windowDays, setWindowDays] = useState(7)
  const comparisons = useMarkerComparisonsQuery(windowDays)
  return (
    <div className="grid gap-5">
      <SectionCard
        title="Noter un changement"
        description="Coupé un connecteur, élagué MEMORY.md, passé les agents sur Sonnet ? Note-le à la date où tu l’as fait : l’audit compare les jours d’avant et d’après, avec des indicateurs ramenés au message et à la session pour neutraliser le volume d’activité."
      >
        <NewMarkerForm projects={projects} defaultProject={filter.project} labelSuggestions={labelSuggestions} />
      </SectionCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Effet des changements</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Fenêtre de comparaison
          <ToggleGroup
            variant="outline"
            size="sm"
            spacing={0}
            value={[String(windowDays)]}
            onValueChange={(values) => {
              const next = values[0]
              if (next) setWindowDays(Number(next))
            }}
          >
            {WINDOW_OPTIONS.map((option) => (
              <ToggleGroupItem key={option} value={option}>
                {option} j
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      {comparisons.isPending && <Skeleton className="h-64 w-full" />}
      {comparisons.isError && <p className="text-destructive">{comparisons.error.message}</p>}
      {comparisons.data?.comparisons.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">Aucun changement noté. Ajoutes-en un au moment où tu appliques un conseil.</p>
      )}
      {comparisons.data?.comparisons.map((comparison) => (
        <MarkerComparisonCard key={comparison.marker.id} comparison={comparison} />
      ))}
    </div>
  )
}
