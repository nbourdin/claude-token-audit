import type { NewChangeMarker } from '@claude-token-audit/server/marker-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useCreateMarkerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (marker: NewChangeMarker) => api.createMarker(marker),
    onSuccess: () =>
      Promise.all([queryClient.invalidateQueries({ queryKey: ['marker-comparisons'] }), queryClient.invalidateQueries({ queryKey: ['report'] })]),
  })
}
