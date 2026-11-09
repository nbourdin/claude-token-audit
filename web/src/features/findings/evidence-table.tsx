import type { FindingEvidence } from '@claude-token-audit/server/report-types'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type EvidenceTableProps = {
  evidence: FindingEvidence[]
  onOpenSession: (sessionId: string) => void
}

export function EvidenceTable({ evidence, onOpenSession }: EvidenceTableProps) {
  return (
    <Table>
      <TableBody>
        {evidence.map((item, index) => {
          const sessionId = item.sessionId
          return (
            <TableRow
              key={`${item.label}-${index}`}
              className={cn(sessionId && 'cursor-pointer')}
              onClick={sessionId ? () => onOpenSession(sessionId) : undefined}
            >
              <TableCell className="max-w-md truncate" title={item.label}>
                {item.label}
              </TableCell>
              <TableCell className="text-right tabular-nums">{item.value}</TableCell>
              <TableCell className="text-muted-foreground">{item.detail}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
