import type { ReportFilter } from '@claude-token-audit/server/report-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useGenerateAdviceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filter: ReportFilter) => api.generateAdvice(filter),
    onSuccess: ({ advice }) => queryClient.setQueryData(['advice'], { advice, inProgress: false }),
  })
}
