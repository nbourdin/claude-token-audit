import { calibrateModelRates } from '../cost/model-rates.ts'
import type { ChangeMarker } from '../markers/change-marker.ts'
import type { SessionSummary } from '../model/session-summary.ts'
import type { PeriodMetrics } from './compute-period-metrics.ts'
import { computePeriodMetrics } from './compute-period-metrics.ts'

export type { PeriodMetrics }

const DAY_MS = 24 * 60 * 60 * 1000
const MINIMUM_SESSIONS_FOR_CONFIDENCE = 5

export type MarkerComparison = {
  marker: ChangeMarker
  windowDays: number
  before: PeriodMetrics
  after: PeriodMetrics
  afterDaysElapsed: number
  hasEnoughData: boolean
}

export function buildMarkerComparisons(sessions: SessionSummary[], markers: ChangeMarker[], windowDays: number, now = Date.now()): MarkerComparison[] {
  const rates = calibrateModelRates(sessions)
  const windowMs = windowDays * DAY_MS
  return markers.map((marker) => {
    const afterEnd = Math.min(marker.at + windowMs, now)
    const before = computePeriodMetrics(sessions, rates, { from: marker.at - windowMs, to: marker.at, project: marker.project })
    const after = computePeriodMetrics(sessions, rates, { from: marker.at, to: afterEnd, project: marker.project })
    return {
      marker,
      windowDays,
      before,
      after,
      afterDaysElapsed: Math.max(0, (afterEnd - marker.at) / DAY_MS),
      hasEnoughData: before.sessions >= MINIMUM_SESSIONS_FOR_CONFIDENCE && after.sessions >= MINIMUM_SESSIONS_FOR_CONFIDENCE,
    }
  })
}
