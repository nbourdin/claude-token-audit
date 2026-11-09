import type { ReportFilter } from '@claude-token-audit/server/report-types'
import { Sparkles } from 'lucide-react'
import { InlineCodeText } from '@/components/inline-code-text'
import { SectionCard } from '@/components/section-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGenerateAdviceMutation } from '@/hooks/use-generate-advice-mutation'
import { useLatestAdviceQuery } from '@/hooks/use-latest-advice-query'
import { formatDateTime, formatUSD } from '@/lib/format'
import { AdviceActionItem } from './advice-action-item'

function describeFilter(filter: ReportFilter): string {
  return `${filter.sinceDays === null ? 'tout l’historique' : `${filter.sinceDays} derniers jours`} · ${filter.project ?? 'tous les projets'}`
}

export function AdviceTab({ filter }: { filter: ReportFilter }) {
  const latest = useLatestAdviceQuery()
  const generate = useGenerateAdviceMutation()
  const stored = latest.data?.advice ?? null
  return (
    <div className="grid gap-5">
      <SectionCard
        title="Conseils de Claude"
        description={`Claude lit un résumé chiffré de l’audit (${describeFilter(filter)}) et rend un plan d’action priorisé. Un seul appel, sans outils ni contexte de projet : quelques centimes.`}
        action={
          <Button onClick={() => generate.mutate(filter)} disabled={generate.isPending}>
            <Sparkles className={generate.isPending ? 'animate-pulse' : undefined} />
            {generate.isPending ? 'Analyse en cours…' : stored ? 'Régénérer' : 'Générer les conseils'}
          </Button>
        }
      />
      {generate.isError && (
        <Alert variant="destructive">
          <AlertTitle>La génération a échoué</AlertTitle>
          <AlertDescription>{generate.error.message}</AlertDescription>
        </Alert>
      )}
      {generate.isPending && <Skeleton className="h-64 w-full" />}
      {!generate.isPending && !stored && !latest.isPending && (
        <p className="py-12 text-center text-muted-foreground">Pas encore de conseils. Lance une première analyse.</p>
      )}
      {!generate.isPending && stored && (
        <SectionCard
          title={stored.advice.headline}
          description={`Généré le ${formatDateTime(stored.createdAt)} par ${stored.model} sur ${describeFilter(stored.filter)} · coût de l’analyse ${formatUSD(stored.costUSD)}`}
        >
          <ol className="grid">
            {stored.advice.actions.map((action, index) => (
              <AdviceActionItem key={action.title} action={action} rank={index + 1} />
            ))}
          </ol>
          {stored.advice.habits.length > 0 && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <h3 className="mb-2 font-semibold">Habitudes à changer</h3>
              <ul className="grid list-disc gap-1 pl-5">
                {stored.advice.habits.map((habit) => (
                  <li key={habit}>
                    <InlineCodeText text={habit} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  )
}
