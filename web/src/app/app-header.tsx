import type { ReportFilter } from '@claude-token-audit/server/report-types'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRefreshTranscriptsMutation } from '@/hooks/use-refresh-transcripts-mutation'
import { formatDateTime } from '@/lib/format'
import { PeriodFilter } from './period-filter'
import { ProjectFilter } from './project-filter'

type AppHeaderProps = {
  filter: ReportFilter
  onFilterChange: (patch: Partial<ReportFilter>) => void
  projects: string[]
  lastIngestAt: number | null
}

export function AppHeader({ filter, onFilterChange, projects, lastIngestAt }: AppHeaderProps) {
  const refresh = useRefreshTranscriptsMutation()
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <div className="mr-auto">
          <h1 className="font-semibold tracking-tight">Claude Token Audit</h1>
          <p className="text-xs text-muted-foreground">
            {lastIngestAt ? `Transcripts lus le ${formatDateTime(lastIngestAt)}` : 'Lecture des transcripts…'} · données locales
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodFilter sinceDays={filter.sinceDays} onChange={(sinceDays) => onFilterChange({ sinceDays })} />
          <ProjectFilter projects={projects} project={filter.project} onChange={(project) => onFilterChange({ project })} />
          <Button variant="outline" size="sm" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
            <RefreshCw className={refresh.isPending ? 'animate-spin' : undefined} />
            Rafraîchir
          </Button>
        </div>
      </div>
    </header>
  )
}
