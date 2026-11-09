import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useMarkerComparisonsQuery(windowDays: number) {
  return useQuery({
    queryKey: ['marker-comparisons', windowDays],
    queryFn: () => api.markerComparisons(windowDays),
    placeholderData: keepPreviousData,
  })
}
