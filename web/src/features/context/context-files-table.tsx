import type { ContextFileAggregate } from '@claude-token-audit/server/report-types'
import { TriangleAlert } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatTokens, formatUSD } from '@/lib/format'

const CATEGORY_LABELS: Record<ContextFileAggregate['category'], string> = {
  'memory-index': 'Index mémoire',
  'memory-note': 'Note mémoire',
  instructions: 'Instructions',
  'claude-config': 'Skill, agent ou règle',
}

const ORIGIN_LABELS: Record<ContextFileAggregate['origins'][number], string> = {
  startup: 'au démarrage',
  nested: 'chargé en route',
  read: 'lu par Claude',
}

export function ContextFilesTable({ files }: { files: ContextFileAggregate[] }) {
  if (files.length === 0) return <p className="py-6 text-center text-muted-foreground">Aucun fichier d’instructions ou de mémoire sur cette période.</p>
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fichier</TableHead>
          <TableHead className="text-right">Taille moyenne</TableHead>
          <TableHead className="text-right">Chargements</TableHead>
          <TableHead className="text-right">Coût</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.path}>
            <TableCell className="max-w-xl whitespace-normal">
              <div className="font-mono text-xs break-all">{file.path}</div>
              <div className="text-xs text-muted-foreground">
                {CATEGORY_LABELS[file.category]} · {file.origins.map((origin) => ORIGIN_LABELS[origin]).join(', ')}
              </div>
            </TableCell>
            <TableCell className="text-right align-top">
              <div className="inline-flex items-center gap-1 tabular-nums">
                {file.isOversized && <TriangleAlert className="size-3.5 text-status-serious" aria-hidden />}
                {formatTokens(file.averageTokens)}
              </div>
              <div className="text-xs text-muted-foreground">{file.isOversized ? `trop lourd, cible ${formatTokens(file.thresholdTokens)}` : `cible ${formatTokens(file.thresholdTokens)}`}</div>
            </TableCell>
            <TableCell className="text-right align-top tabular-nums">
              <div>{file.loads}</div>
              <div className="text-xs text-muted-foreground">
                {file.sessions} session{file.sessions > 1 ? 's' : ''}
              </div>
            </TableCell>
            <TableCell className="text-right align-top tabular-nums">{formatUSD(file.costUSD)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
