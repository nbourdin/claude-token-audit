import type { AppliedActionView, ProposedAction } from '@claude-token-audit/server/action-types'
import type { StoredAdvice } from '@claude-token-audit/server/advice-types'
import type { MarkerComparison } from '@claude-token-audit/server/comparison-types'
import type { ChangeMarker, NewChangeMarker } from '@claude-token-audit/server/marker-types'
import type { AuditReportResponse, ReportFilter } from '@claude-token-audit/server/report-types'
import type { SessionDetail } from '@claude-token-audit/server/session-detail-types'

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(typeof body.error === 'string' ? body.error : `HTTP ${response.status}`)
  }
  return response.json()
}

export function filterQueryString(filter: ReportFilter): string {
  const params = new URLSearchParams({ days: filter.sinceDays === null ? 'all' : String(filter.sinceDays) })
  if (filter.project) params.set('project', filter.project)
  return params.toString()
}

export const api = {
  report: (filter: ReportFilter) => requestJson<AuditReportResponse>(`/api/report?${filterQueryString(filter)}`),
  session: (sessionId: string) => requestJson<SessionDetail>(`/api/sessions/${encodeURIComponent(sessionId)}`),
  refresh: () => requestJson<{ parsedFiles: number; durationMs: number }>('/api/ingest', { method: 'POST' }),
  latestAdvice: () => requestJson<{ advice: StoredAdvice | null; inProgress: boolean }>('/api/advice'),
  generateAdvice: (filter: ReportFilter) => requestJson<{ advice: StoredAdvice }>(`/api/advice?${filterQueryString(filter)}`, { method: 'POST' }),
  markerComparisons: (windowDays: number) => requestJson<{ comparisons: MarkerComparison[] }>(`/api/markers?windowDays=${windowDays}`),
  createMarker: (marker: NewChangeMarker) =>
    requestJson<{ marker: ChangeMarker }>('/api/markers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(marker) }),
  deleteMarker: (markerId: string) => requestJson<{ removed: boolean }>(`/api/markers/${encodeURIComponent(markerId)}`, { method: 'DELETE' }),
  actions: () => requestJson<{ proposals: ProposedAction[]; applied: AppliedActionView[] }>('/api/actions'),
  applyAction: (key: string) =>
    requestJson<{ appliedId: string }>('/api/actions/apply', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key }) }),
  undoAction: (appliedActionId: string) => requestJson<{ undoneId: string }>(`/api/actions/${encodeURIComponent(appliedActionId)}/undo`, { method: 'POST' }),
}
