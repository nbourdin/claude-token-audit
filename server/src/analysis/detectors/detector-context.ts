import type { ModelRates } from '../../cost/model-rates.ts'
import type { Finding, FindingSeverity } from '../report-types.ts'
import type { SessionMetrics } from '../session-metrics.ts'

export type DetectorContext = {
  metrics: SessionMetrics[]
  rates: ModelRates
  totalCostUSD: number
}

export type Detector = (context: DetectorContext) => Finding | null

const HIGH_SHARE = 0.08
const MEDIUM_SHARE = 0.02

export function severityFor(impactUSD: number, totalCostUSD: number): FindingSeverity {
  const share = totalCostUSD > 0 ? impactUSD / totalCostUSD : 0
  if (share >= HIGH_SHARE) return 'high'
  if (share >= MEDIUM_SHARE) return 'medium'
  return 'low'
}

export function fixedContextCostUSD(tokensPerRequest: number, metrics: SessionMetrics, rates: ModelRates): number {
  const price = rates.inputPriceFor(metrics.mainModel)
  const writes = 1 + metrics.cacheRebuilds.length
  const reads = Math.max(0, metrics.mainRequests.length - writes)
  return tokensPerRequest * price * (writes * 2 + reads * 0.1)
}
