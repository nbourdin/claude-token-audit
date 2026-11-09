import type { AppliedActionView } from '@claude-token-audit/server/action-types'
import { Undo2 } from 'lucide-react'
import { ConfirmButton } from '@/components/confirm-button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useUndoActionMutation } from '@/hooks/use-undo-action-mutation'
import { formatDateTime } from '@/lib/format'
import { MeasuredSavingCell } from './measured-saving-cell'
import { VerificationBadge } from './verification-badge'

export function AppliedActionsTable({ applied }: { applied: AppliedActionView[] }) {
  const undo = useUndoActionMutation()
  return (
    <div className="grid gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Vérification</TableHead>
            <TableHead className="text-right">Économie mesurée</TableHead>
            <TableHead className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {applied.map((action) => (
            <TableRow key={action.id} className={action.undoneAt ? 'opacity-60' : undefined}>
              <TableCell className="max-w-md align-top whitespace-normal">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  appliquée le {formatDateTime(action.appliedAt)}
                  {action.undoneAt ? `, annulée le ${formatDateTime(action.undoneAt)}` : ''}
                </div>
              </TableCell>
              <TableCell className="max-w-md align-top whitespace-normal">
                <div className="grid justify-items-start gap-1">
                  <VerificationBadge status={action.verification.status} />
                  {action.verification.status !== 'undone' && <p className="text-xs text-muted-foreground">{action.verification.detail}</p>}
                  {action.verification.lastAffectedAt !== null && (
                    <p className="text-xs text-muted-foreground tabular-nums">Dernière session concernée : {formatDateTime(action.verification.lastAffectedAt)}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="align-top">
                <MeasuredSavingCell action={action} />
              </TableCell>
              <TableCell className="text-right align-top">
                {action.undoneAt === null && (
                  <ConfirmButton
                    label={
                      <>
                        <Undo2 /> Annuler
                      </>
                    }
                    confirmLabel="Confirmer l’annulation"
                    variant="outline"
                    isPending={undo.isPending}
                    onConfirm={() => undo.mutate(action.id)}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {undo.isError && <p className="text-sm text-destructive">{undo.error.message}</p>}
    </div>
  )
}
