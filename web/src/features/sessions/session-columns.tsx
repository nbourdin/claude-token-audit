import type { SessionRow } from '@claude-token-audit/server/report-types'
import type { ReactNode } from 'react'
import { formatDateTime, formatDuration, formatTokens, formatUSD } from '@/lib/format'

export type SessionSortKey = keyof Pick<
  SessionRow,
  | 'startedAt'
  | 'title'
  | 'costUSD'
  | 'userPrompts'
  | 'requests'
  | 'averageContextTokens'
  | 'peakContextTokens'
  | 'cacheRebuildCostUSD'
  | 'subagentCostUSD'
  | 'durationMinutes'
>

export type SessionColumn = {
  key: SessionSortKey
  label: string
  isNumeric: boolean
  render: (row: SessionRow) => ReactNode
}

const dashIfZero = (value: number, format: (value: number) => string) => (value > 0 ? format(value) : '—')

export const SESSION_COLUMNS: SessionColumn[] = [
  { key: 'startedAt', label: 'Début', isNumeric: false, render: (row) => formatDateTime(row.startedAt) },
  {
    key: 'title',
    label: 'Session',
    isNumeric: false,
    render: (row) => (
      <div className="grid max-w-md">
        <span className="truncate" title={row.title}>
          {row.title}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {row.projectName}
          {row.worktree ? ` · ${row.worktree}` : ''}
        </span>
      </div>
    ),
  },
  { key: 'costUSD', label: 'Coût', isNumeric: true, render: (row) => formatUSD(row.costUSD) },
  { key: 'userPrompts', label: 'Messages', isNumeric: true, render: (row) => row.userPrompts },
  { key: 'requests', label: 'Requêtes', isNumeric: true, render: (row) => row.requests },
  { key: 'averageContextTokens', label: 'Contexte moy.', isNumeric: true, render: (row) => formatTokens(row.averageContextTokens) },
  { key: 'peakContextTokens', label: 'Pic', isNumeric: true, render: (row) => formatTokens(row.peakContextTokens) },
  { key: 'cacheRebuildCostUSD', label: 'Cache réécrit', isNumeric: true, render: (row) => dashIfZero(row.cacheRebuildCostUSD, formatUSD) },
  { key: 'subagentCostUSD', label: 'Sous-agents', isNumeric: true, render: (row) => dashIfZero(row.subagentCostUSD, formatUSD) },
  { key: 'durationMinutes', label: 'Durée', isNumeric: true, render: (row) => formatDuration(row.durationMinutes) },
]
