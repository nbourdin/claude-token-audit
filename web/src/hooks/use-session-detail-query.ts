import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useSessionDetailQuery(sessionId: string | null) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.session(sessionId ?? ''),
    enabled: sessionId !== null,
  })
}
