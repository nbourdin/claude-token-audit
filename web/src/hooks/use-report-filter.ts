import type { ReportFilter } from '@claude-token-audit/server/report-types'
import { useCallback, useEffect, useState } from 'react'

const DEFAULT_DAYS = 30

function readFilterFromUrl(): ReportFilter {
  const params = new URLSearchParams(window.location.search)
  const days = params.get('days')
  return {
    sinceDays: days === 'all' ? null : Number(days ?? DEFAULT_DAYS) || DEFAULT_DAYS,
    project: params.get('project') || null,
  }
}

function writeFilterToUrl(filter: ReportFilter): void {
  const params = new URLSearchParams(window.location.search)
  params.set('days', filter.sinceDays === null ? 'all' : String(filter.sinceDays))
  if (filter.project) params.set('project', filter.project)
  else params.delete('project')
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`)
}

export function useReportFilter(): [ReportFilter, (patch: Partial<ReportFilter>) => void] {
  const [filter, setFilter] = useState<ReportFilter>(readFilterFromUrl)
  useEffect(() => writeFilterToUrl(filter), [filter])
  const updateFilter = useCallback((patch: Partial<ReportFilter>) => setFilter((current) => ({ ...current, ...patch })), [])
  return [filter, updateFilter]
}
