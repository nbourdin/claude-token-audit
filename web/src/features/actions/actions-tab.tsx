import { SectionCard } from '@/components/section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useActionsQuery } from '@/hooks/use-actions-query'
import { formatUSD } from '@/lib/format'
import { AppliedActionsTable } from './applied-actions-table'
import { ProposedActionCard } from './proposed-action-card'

export function ActionsTab() {
  const actions = useActionsQuery()
  if (actions.isPending) return <Skeleton className="h-96 w-full" />
  if (actions.isError) return <p className="text-destructive">{actions.error.message}</p>
  const { proposals, applied } = actions.data
  const automaticSavingUSD = proposals.filter((proposal) => proposal.payload.kind !== 'manual').reduce((total, proposal) => total + proposal.estimatedMonthlySavingUSD, 0)
  const manualSavingUSD = proposals.filter((proposal) => proposal.payload.kind === 'manual').reduce((total, proposal) => total + proposal.estimatedMonthlySavingUSD, 0)
  return (
    <div className="grid gap-5">
      <SectionCard
        title={`${proposals.length} actions possibles`}
        description={`≈ ${formatUSD(automaticSavingUSD)} / mois en un clic, ≈ ${formatUSD(manualSavingUSD)} / mois à faire toi-même. Chaque action montre ce qu’elle change, se défait d’un clic, et pose un repère dans « Avant / après » pour mesurer son effet réel. Les économies sont des estimations sur les 30 derniers jours, en équivalent prix API.`}
      />
      {proposals.map((proposal) => (
        <ProposedActionCard key={proposal.key} proposal={proposal} />
      ))}
      {proposals.length === 0 && <p className="py-12 text-center text-muted-foreground">Plus aucune action à proposer.</p>}
      {applied.length > 0 && (
        <SectionCard title="Journal des actions" description="Annuler remet la configuration exacte d’avant et retire le repère avant/après.">
          <AppliedActionsTable applied={applied} />
        </SectionCard>
      )}
    </div>
  )
}
