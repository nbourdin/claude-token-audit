import type { ModelRates } from '../cost/model-rates.ts'
import type { SessionSummary } from '../model/session-summary.ts'
import { sum } from './format.ts'
import type { SessionMetrics } from './session-metrics.ts'
import { computeSessionMetrics } from './session-metrics.ts'

const LARGE_RESULT_TOKENS = 5_000

export type PeriodMetrics = {
  from: number
  to: number
  sessions: number
  userPrompts: number
  costUSD: number
  costPerPromptUSD: number
  costPerSessionUSD: number
  averageBaselineTokens: number
  averageContextTokens: number
  cacheHitRatio: number
  cacheRebuildCostPerSessionUSD: number
  largeToolResultCostPerSessionUSD: number
  toolErrorRate: number
}

function perSession(total: number, sessions: number): number {
  return sessions > 0 ? total / sessions : 0
}

function summarize(metrics: SessionMetrics[], from: number, to: number): PeriodMetrics {
  const requests = metrics.flatMap((metric) => metric.session.requests)
  const mainRequests = metrics.flatMap((metric) => metric.mainRequests)
  const toolCalls = metrics.flatMap((metric) => metric.toolCalls)
  const withBaseline = metrics.filter((metric) => metric.baselineTokens > 0)
  const cacheRead = sum(requests, (request) => request.usage.cacheRead)
  const cacheWrite = sum(requests, (request) => request.usage.cacheWrite5m + request.usage.cacheWrite1h)
  const uncached = sum(requests, (request) => request.usage.input)
  const costUSD = sum(metrics, (metric) => metric.costUSD)
  const userPrompts = sum(metrics, (metric) => metric.session.userPrompts.length)
  return {
    from,
    to,
    sessions: metrics.length,
    userPrompts,
    costUSD,
    costPerPromptUSD: userPrompts > 0 ? costUSD / userPrompts : 0,
    costPerSessionUSD: perSession(costUSD, metrics.length),
    averageBaselineTokens: withBaseline.length > 0 ? sum(withBaseline, (metric) => metric.baselineTokens) / withBaseline.length : 0,
    averageContextTokens: mainRequests.length > 0 ? sum(mainRequests, (request) => request.contextTokens) / mainRequests.length : 0,
    cacheHitRatio: cacheRead / Math.max(1, cacheRead + cacheWrite + uncached),
    cacheRebuildCostPerSessionUSD: perSession(
      sum(metrics, (metric) => sum(metric.cacheRebuilds.filter((rebuild) => rebuild.cause !== 'compaction'), (rebuild) => rebuild.extraCostUSD)),
      metrics.length,
    ),
    largeToolResultCostPerSessionUSD: perSession(
      sum(toolCalls.filter((toolCall) => toolCall.resultTokens >= LARGE_RESULT_TOKENS), (toolCall) => toolCall.costUSD),
      metrics.length,
    ),
    toolErrorRate: toolCalls.length > 0 ? toolCalls.filter((toolCall) => toolCall.isError).length / toolCalls.length : 0,
  }
}

export function computePeriodMetrics(
  sessions: SessionSummary[],
  rates: ModelRates,
  window: { from: number; to: number; project: string | null },
): PeriodMetrics {
  const inWindow = sessions.filter(
    (session) => session.startedAt >= window.from && session.startedAt < window.to && (window.project === null || session.projectName === window.project),
  )
  return summarize(
    inWindow.map((session) => computeSessionMetrics(session, rates)),
    window.from,
    window.to,
  )
}
