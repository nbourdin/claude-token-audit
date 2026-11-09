import type { SessionDetail } from '@claude-token-audit/server/session-detail-types'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatTokens, formatUSD } from '@/lib/format'

type SessionToolCallsTableProps = {
  toolCalls: SessionDetail['toolCalls']
}

export function SessionToolCallsTable({ toolCalls }: SessionToolCallsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Outil</TableHead>
          <TableHead>Cible</TableHead>
          <TableHead className="text-right">Résultat</TableHead>
          <TableHead className="text-right">Relu</TableHead>
          <TableHead className="text-right">Coût</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {toolCalls.map((toolCall) => (
          <TableRow key={toolCall.id}>
            <TableCell className="font-mono text-xs">
              {toolCall.name}
              {toolCall.isError && (
                <Badge variant="destructive" className="ml-2">
                  erreur
                </Badge>
              )}
              {toolCall.threadId !== 'main' && (
                <Badge variant="secondary" className="ml-2">
                  sous-agent
                </Badge>
              )}
            </TableCell>
            <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground" title={toolCall.target}>
              {toolCall.target}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatTokens(toolCall.resultTokens)}</TableCell>
            <TableCell className="text-right tabular-nums">×{toolCall.carriedRequests}</TableCell>
            <TableCell className="text-right tabular-nums">{formatUSD(toolCall.costUSD)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
