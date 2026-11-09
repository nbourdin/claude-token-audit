import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useLatestAdviceQuery() {
  return useQuery({ queryKey: ['advice'], queryFn: api.latestAdvice })
}
