import type { ModelSummary } from '@claude-token-audit/server/report-types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatUSD } from '@/lib/format'

export function ModelPricesTable({ models }: { models: ModelSummary[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Modèle</TableHead>
          <TableHead className="text-right">Requêtes</TableHead>
          <TableHead className="text-right">Coût</TableHead>
          <TableHead className="text-right">Entrée $/M</TableHead>
          <TableHead>Source du prix</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {models.map((model) => (
          <TableRow key={model.model}>
            <TableCell className="font-mono text-xs">{model.model}</TableCell>
            <TableCell className="text-right tabular-nums">{model.requests.toLocaleString('fr-FR')}</TableCell>
            <TableCell className="text-right tabular-nums">{formatUSD(model.costUSD)}</TableCell>
            <TableCell className="text-right tabular-nums">{model.inputPricePerMillion.toFixed(2)}</TableCell>
            <TableCell className="text-muted-foreground">{model.priceSource === 'reported' ? 'coûts enregistrés par Claude Code' : 'prix par défaut de la famille'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
