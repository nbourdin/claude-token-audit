import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useRefreshTranscriptsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.refresh,
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
