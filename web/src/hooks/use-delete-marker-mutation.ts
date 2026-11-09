import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useDeleteMarkerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (markerId: string) => api.deleteMarker(markerId),
    onSuccess: () =>
      Promise.all([queryClient.invalidateQueries({ queryKey: ['marker-comparisons'] }), queryClient.invalidateQueries({ queryKey: ['report'] })]),
  })
}
