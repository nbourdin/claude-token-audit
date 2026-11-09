import type { SessionRow } from '@claude-token-audit/server/report-types'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SectionCard } from '@/components/section-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { SessionSortKey } from './session-columns'
import { SESSION_COLUMNS } from './session-columns'

type SessionsTabProps = {
  sessions: SessionRow[]
  onOpenSession: (sessionId: string) => void
}

export function SessionsTab({ sessions, onOpenSession }: SessionsTabProps) {
  const [sortKey, setSortKey] = useState<SessionSortKey>('costUSD')
  const [isDescending, setIsDescending] = useState(true)
  const sortedSessions = useMemo(() => {
    const direction = isDescending ? -1 : 1
    return [...sessions].sort((left, right) => {
      const leftValue = left[sortKey]
      const rightValue = right[sortKey]
      if (typeof leftValue === 'string' && typeof rightValue === 'string') return direction * leftValue.localeCompare(rightValue)
      return direction * (Number(leftValue) - Number(rightValue))
    })
  }, [sessions, sortKey, isDescending])
  const toggleSort = (key: SessionSortKey) => {
    if (key === sortKey) setIsDescending((current) => !current)
    else {
      setSortKey(key)
      setIsDescending(true)
    }
  }
  const SortIcon = isDescending ? ArrowDown : ArrowUp
  return (
    <SectionCard title={`${sessions.length} sessions`} description="Clique une session pour voir l’évolution de son contexte et ce qui l’a rempli.">
      <Table>
        <TableHeader>
          <TableRow>
            {SESSION_COLUMNS.map((column) => (
              <TableHead key={column.key} className={cn('cursor-pointer select-none hover:text-foreground', column.isNumeric && 'text-right')} onClick={() => toggleSort(column.key)}>
                <span className="inline-flex items-center gap-1">
                  {column.label}
                  {sortKey === column.key && <SortIcon className="size-3.5" />}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSessions.map((session) => (
            <TableRow key={session.sessionId} className="cursor-pointer" onClick={() => onOpenSession(session.sessionId)}>
              {SESSION_COLUMNS.map((column) => (
                <TableCell key={column.key} className={cn(column.isNumeric && 'text-right tabular-nums')}>
                  {column.render(session)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  )
}
