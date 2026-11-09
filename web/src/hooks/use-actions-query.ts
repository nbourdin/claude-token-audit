import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useActionsQuery() {
  return useQuery({ queryKey: ['actions'], queryFn: api.actions })
}
