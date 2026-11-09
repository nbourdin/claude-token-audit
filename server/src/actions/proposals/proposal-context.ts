import type { AuditReport } from '../../analysis/report-types.ts'
import type { SessionMetrics } from '../../analysis/session-metrics.ts'
import type { ModelRates } from '../../cost/model-rates.ts'
import type { SessionSummary } from '../../model/session-summary.ts'

export type ProposalContext = {
  allSessions: SessionSummary[]
  recentMetrics: SessionMetrics[]
  recentReport: AuditReport
  rates: ModelRates
}

export const PROPOSAL_WINDOW_DAYS = 30
