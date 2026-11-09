import type { SessionSummary } from '../model/session-summary.ts'
import type { ReportFilter } from './report-types.ts'

const DAY_MS = 24 * 60 * 60 * 1000

export function filterSessions(sessions: SessionSummary[], filter: ReportFilter, now = Date.now()): SessionSummary[] {
  const since = filter.sinceDays === null ? 0 : now - filter.sinceDays * DAY_MS
  return sessions.filter((session) => session.endedAt >= since && (filter.project === null || session.projectName === filter.project))
}
