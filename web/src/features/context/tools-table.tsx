import type { ToolAggregate } from '@claude-token-audit/server/report-types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatTokens, formatUSD } from '@/lib/format'

export function ToolsTable({ tools }: { tools: ToolAggregate[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Outil</TableHead>
          <TableHead className="text-right">Appels</TableHead>
          <TableHead className="text-right">Erreurs</TableHead>
          <TableHead className="text-right">Tokens de résultats</TableHead>
          <TableHead className="text-right">Tokens relus</TableHead>
          <TableHead className="text-right">Coût</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tools.map((tool) => (
          <TableRow key={tool.name}>
            <TableCell className="max-w-sm truncate font-mono text-xs" title={tool.name}>
              {tool.name}
            </TableCell>
            <TableCell className="text-right tabular-nums">{tool.calls}</TableCell>
            <TableCell className="text-right tabular-nums">{tool.errors || '—'}</TableCell>
            <TableCell className="text-right tabular-nums">{formatTokens(tool.resultTokens)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatTokens(tool.carriedTokens)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatUSD(tool.costUSD)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
