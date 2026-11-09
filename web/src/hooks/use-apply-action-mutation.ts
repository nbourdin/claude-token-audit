import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useApplyActionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => api.applyAction(key),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['actions'] }),
        queryClient.invalidateQueries({ queryKey: ['report'] }),
        queryClient.invalidateQueries({ queryKey: ['marker-comparisons'] }),
      ]),
  })
}
