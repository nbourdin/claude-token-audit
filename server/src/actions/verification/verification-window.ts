import type { SessionMetrics } from '../../analysis/session-metrics.ts'
import type { ModelRates } from '../../cost/model-rates.ts'
import type { AppliedAction } from '../action-types.ts'

export const BEFORE_WINDOW_DAYS = 30
export const DAY_MS = 24 * 60 * 60 * 1000
const MONTH_DAYS = 30

export type VerificationWindow = {
  applied: AppliedAction
  before: SessionMetrics[]
  after: SessionMetrics[]
  rates: ModelRates
  daysElapsed: number
}

export function buildVerificationWindow(applied: AppliedAction, metrics: SessionMetrics[], rates: ModelRates, now: number): VerificationWindow {
  const inScope = metrics.filter((metric) => applied.project === null || metric.session.projectName === applied.project)
  return {
    applied,
    before: inScope.filter((metric) => metric.session.startedAt >= applied.appliedAt - BEFORE_WINDOW_DAYS * DAY_MS && metric.session.startedAt < applied.appliedAt),
    after: inScope.filter((metric) => metric.session.startedAt >= applied.appliedAt),
    rates,
    daysElapsed: Math.max(0, (now - applied.appliedAt) / DAY_MS),
  }
}

export function toMonthlyRate(totalUSD: number, daysElapsed: number): number {
  return (totalUSD * MONTH_DAYS) / Math.max(1, daysElapsed)
}
