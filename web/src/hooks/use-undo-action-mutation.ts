import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useUndoActionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (appliedActionId: string) => api.undoAction(appliedActionId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['actions'] }),
        queryClient.invalidateQueries({ queryKey: ['report'] }),
        queryClient.invalidateQueries({ queryKey: ['marker-comparisons'] }),
      ]),
  })
}
