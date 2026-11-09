import type { ProposedAction } from '@claude-token-audit/server/action-types'
import { CheckCheck, Wand2 } from 'lucide-react'
import { ConfirmButton } from '@/components/confirm-button'
import { CopyButton } from '@/components/copy-button'
import { InlineCodeText } from '@/components/inline-code-text'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApplyActionMutation } from '@/hooks/use-apply-action-mutation'
import { formatUSD } from '@/lib/format'

export function ProposedActionCard({ proposal }: { proposal: ProposedAction }) {
  const apply = useApplyActionMutation()
  const isManual = proposal.payload.kind === 'manual'
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {proposal.title}
          <Badge variant={isManual ? 'outline' : 'secondary'}>{isManual ? 'à faire toi-même' : 'automatique'}</Badge>
        </CardTitle>
        <CardDescription>
          <InlineCodeText text={proposal.rationale} />
        </CardDescription>
        <CardAction className="text-right">
          <div className="font-semibold text-status-good tabular-nums">≈ {formatUSD(proposal.estimatedMonthlySavingUSD)} / mois</div>
          <div className="text-xs text-muted-foreground">économie estimée</div>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <ul className="grid gap-1 text-sm">
          {proposal.changes.map((change) => (
            <li key={change.target} className="flex flex-wrap gap-x-2">
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{change.target}</code>
              <span className="text-muted-foreground">
                <InlineCodeText text={change.description} />
              </span>
            </li>
          ))}
        </ul>
        {proposal.payload.kind === 'manual' && <p className="text-sm">{proposal.payload.instructions}</p>}
        {proposal.payload.kind === 'manual' && proposal.payload.prompt && (
          <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">{proposal.payload.prompt}</pre>
        )}
        {proposal.caveat && <p className="text-xs text-muted-foreground">{proposal.caveat}</p>}
        <div className="flex flex-wrap items-center gap-2">
          {proposal.payload.kind === 'manual' && proposal.payload.prompt && <CopyButton text={proposal.payload.prompt} label="Copier le prompt" />}
          <ConfirmButton
            label={
              isManual ? (
                <>
                  <CheckCheck /> Marquer comme fait
                </>
              ) : (
                <>
                  <Wand2 /> Appliquer
                </>
              )
            }
            confirmLabel={isManual ? 'Confirmer : c’est fait' : 'Confirmer et appliquer'}
            variant={isManual ? 'outline' : 'default'}
            isPending={apply.isPending}
            onConfirm={() => apply.mutate(proposal.key)}
          />
          {apply.isError && <span className="text-sm text-destructive">{apply.error.message}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
