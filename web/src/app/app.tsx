import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdviceTab } from '@/features/advice/advice-tab'
import { BeforeAfterTab } from '@/features/before-after/before-after-tab'
import { ContextTab } from '@/features/context/context-tab'
import { FindingsTab } from '@/features/findings/findings-tab'
import { OverviewTab } from '@/features/overview/overview-tab'
import { SessionDetailSheet } from '@/features/sessions/session-detail-sheet'
import { SessionsTab } from '@/features/sessions/sessions-tab'
import { useLatestAdviceQuery } from '@/hooks/use-latest-advice-query'
import { useReportFilter } from '@/hooks/use-report-filter'
import { useReportQuery } from '@/hooks/use-report-query'
import { useSystemDarkMode } from '@/hooks/use-system-dark-mode'
import { AppHeader } from './app-header'

export type AppTab = 'overview' | 'findings' | 'sessions' | 'context' | 'advice' | 'before-after'

export function App() {
  useSystemDarkMode()
  const [filter, updateFilter] = useReportFilter()
  const [tab, setTab] = useState<AppTab>('overview')
  const [openSessionId, setOpenSessionId] = useState<string | null>(null)
  const report = useReportQuery(filter)
  const latestAdvice = useLatestAdviceQuery()
  const labelSuggestions = [
    ...(latestAdvice.data?.advice?.advice.actions.map((action) => action.title) ?? []),
    ...(report.data?.findings.map((finding) => finding.title) ?? []),
  ]
  return (
    <div className="min-h-screen">
      <AppHeader filter={filter} onFilterChange={updateFilter} projects={report.data?.availableProjects ?? []} lastIngestAt={report.data?.lastIngestAt ?? null} />
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6">
        {report.isError && (
          <Alert variant="destructive">
            <AlertTitle>Impossible de charger le rapport</AlertTitle>
            <AlertDescription>{report.error.message} — le serveur tourne-t-il (`pnpm dev`) ?</AlertDescription>
          </Alert>
        )}
        {!report.data && !report.isError && <Skeleton className="h-96 w-full" />}
        {report.data && (
          <Tabs value={tab} onValueChange={(value: AppTab) => setTab(value)}>
            <TabsList variant="line" className="mb-3 overflow-x-auto">
              <TabsTrigger value="overview">Vue d’ensemble</TabsTrigger>
              <TabsTrigger value="findings">Constats ({report.data.findings.length})</TabsTrigger>
              <TabsTrigger value="sessions">Sessions ({report.data.sessions.length})</TabsTrigger>
              <TabsTrigger value="context">Contexte &amp; outils</TabsTrigger>
              <TabsTrigger value="advice">Conseils Claude</TabsTrigger>
              <TabsTrigger value="before-after">Avant / après</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <OverviewTab report={report.data} markers={report.data.markers} onOpenTab={setTab} />
            </TabsContent>
            <TabsContent value="findings">
              <FindingsTab report={report.data} onOpenSession={setOpenSessionId} />
            </TabsContent>
            <TabsContent value="sessions">
              <SessionsTab sessions={report.data.sessions} onOpenSession={setOpenSessionId} />
            </TabsContent>
            <TabsContent value="context">
              <ContextTab report={report.data} />
            </TabsContent>
            <TabsContent value="advice">
              <AdviceTab filter={filter} />
            </TabsContent>
            <TabsContent value="before-after">
              <BeforeAfterTab filter={filter} projects={report.data.availableProjects} labelSuggestions={labelSuggestions} />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <SessionDetailSheet sessionId={openSessionId} onClose={() => setOpenSessionId(null)} />
    </div>
  )
}
