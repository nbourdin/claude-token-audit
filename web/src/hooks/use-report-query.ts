import type { ReportFilter } from '@claude-token-audit/server/report-types'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useReportQuery(filter: ReportFilter) {
  return useQuery({
    queryKey: ['report', filter.sinceDays, filter.project],
    queryFn: () => api.report(filter),
    placeholderData: keepPreviousData,
  })
}
