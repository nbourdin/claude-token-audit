import { computeSessionMetrics } from '../../analysis/session-metrics.ts'
import { calibrateModelRates } from '../../cost/model-rates.ts'
import type { SessionSummary } from '../../model/session-summary.ts'
import type { AppliedAction, AppliedActionView } from '../action-types.ts'
import { legacyVerificationTarget } from './legacy-verification-target.ts'
import { verifyAppliedAction } from './verify-applied-action.ts'
import { BEFORE_WINDOW_DAYS, DAY_MS, buildVerificationWindow } from './verification-window.ts'

export function buildAppliedActionViews(sessions: SessionSummary[], journal: AppliedAction[], now = Date.now()): AppliedActionView[] {
  if (journal.length === 0) return []
  const rates = calibrateModelRates(sessions)
  const earliest = Math.min(...journal.map((action) => action.appliedAt)) - BEFORE_WINDOW_DAYS * DAY_MS
  const metrics = sessions.filter((session) => session.startedAt >= earliest).map((session) => computeSessionMetrics(session, rates))
  return journal.map((applied) => {
    const { undo: _undo, verification: target, ...publicFields } = applied
    const window = buildVerificationWindow(applied, metrics, rates, now)
    return { ...publicFields, verification: verifyAppliedAction(window, target ?? legacyVerificationTarget(applied)) }
  })
}
