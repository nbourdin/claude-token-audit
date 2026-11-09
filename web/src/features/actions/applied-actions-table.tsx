import type { AppliedAction } from '@claude-token-audit/server/action-types'
import { Undo2 } from 'lucide-react'
import { ConfirmButton } from '@/components/confirm-button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useUndoActionMutation } from '@/hooks/use-undo-action-mutation'
import { formatDateTime, formatUSD } from '@/lib/format'

export function AppliedActionsTable({ applied }: { applied: AppliedAction[] }) {
  const undo = useUndoActionMutation()
  return (
    <div className="grid gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Appliquée le</TableHead>
            <TableHead className="text-right">Économie estimée</TableHead>
            <TableHead className="text-right">État</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applied.map((action) => (
            <TableRow key={action.id} className={action.undoneAt ? 'opacity-60' : undefined}>
              <TableCell>{action.title}</TableCell>
              <TableCell className="tabular-nums">{formatDateTime(action.appliedAt)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatUSD(action.estimatedMonthlySavingUSD)} / mois</TableCell>
              <TableCell className="text-right">
                {action.undoneAt ? (
                  <Badge variant="outline">annulée le {formatDateTime(action.undoneAt)}</Badge>
                ) : (
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
