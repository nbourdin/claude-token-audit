import { config } from '../config.ts'
import type { ModelRates } from '../cost/model-rates.ts'
import { cacheReadCostUSD, cacheWriteCostUSD, requestCostUSD } from '../cost/request-cost.ts'
import type { ApiRequest, SessionSummary, ToolCall } from '../model/session-summary.ts'
import { MAIN_THREAD_ID } from '../model/session-summary.ts'

export type CacheRebuildCause = 'idle-expiry' | 'compaction' | 'model-switch' | 'tools-or-system-changed' | 'unexplained'

export type CacheRebuild = {
  at: number
  tokens: number
  gapMinutes: number
  cause: CacheRebuildCause
  extraCostUSD: number
}

export type CostedToolCall = ToolCall & {
  resultTokens: number
  carriedTokens: number
  costUSD: number
}

export type SessionMetrics = {
  session: SessionSummary
  costUSD: number
  mainRequests: ApiRequest[]
  mainModel: string
  baselineTokens: number
  tokensPerSectionChar: number
  peakContextTokens: number
  averageContextTokens: number
  cacheRebuilds: CacheRebuild[]
  toolCalls: CostedToolCall[]
  subagentCostUSD: number
}

const REBUILD_MINIMUM_TOKENS = 20_000
const REBUILD_MINIMUM_SHARE = 0.5
const ONE_HOUR_MS = 60 * 60 * 1000
const FIVE_MINUTES_MS = 5 * 60 * 1000

function mostUsedModel(requests: ApiRequest[]): string {
  const counts = new Map<string, number>()
  for (const request of requests) counts.set(request.model, (counts.get(request.model) ?? 0) + 1)
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'unknown'
}

function hasEventBetween(times: number[], after: number, upTo: number): boolean {
  return times.some((time) => time > after && time <= upTo)
}

function rebuildCause(session: SessionSummary, previous: ApiRequest, current: ApiRequest): CacheRebuildCause {
  if (hasEventBetween(session.compactionsAt, previous.at, current.at)) return 'compaction'
  if (previous.model !== current.model) return 'model-switch'
  const cacheLifetime = current.usage.cacheWrite1h > 0 ? ONE_HOUR_MS : FIVE_MINUTES_MS
  if (current.at - previous.at > cacheLifetime) return 'idle-expiry'
  if (hasEventBetween(session.shapeChanges.map((change) => change.at), previous.at, current.at)) return 'tools-or-system-changed'
  return 'unexplained'
}

function detectCacheRebuilds(session: SessionSummary, mainRequests: ApiRequest[], rates: ModelRates): CacheRebuild[] {
  const rebuilds: CacheRebuild[] = []
  for (let index = 1; index < mainRequests.length; index += 1) {
    const previous = mainRequests[index - 1]!
    const current = mainRequests[index]!
    const tokens = current.usage.cacheWrite5m + current.usage.cacheWrite1h
    if (tokens < REBUILD_MINIMUM_TOKENS || tokens < current.contextTokens * REBUILD_MINIMUM_SHARE) continue
    const extraCostUSD = cacheWriteCostUSD(tokens, current.model, rates) - cacheReadCostUSD(tokens, current.model, rates)
    rebuilds.push({
      at: current.at,
      tokens,
      gapMinutes: (current.at - previous.at) / 60_000,
      cause: rebuildCause(session, previous, current),
      extraCostUSD,
    })
  }
  return rebuilds
}

function costToolCalls(toolCalls: ToolCall[], model: string, rates: ModelRates): CostedToolCall[] {
  return toolCalls.map((toolCall) => {
    const resultTokens = Math.round(toolCall.resultChars / config.charsPerToken)
    const carriedTokens = resultTokens * toolCall.carriedRequests
    const costUSD = cacheWriteCostUSD(resultTokens, model, rates) + cacheReadCostUSD(carriedTokens, model, rates)
    return { ...toolCall, resultTokens, carriedTokens, costUSD }
  })
}

export function computeSessionMetrics(session: SessionSummary, rates: ModelRates): SessionMetrics {
  const mainRequests = session.requests.filter((request) => request.threadId === MAIN_THREAD_ID)
  const contextSizes = mainRequests.map((request) => request.contextTokens)
  const baselineTokens = contextSizes[0] ?? 0
  const sectionChars = session.contextSections.reduce((total, section) => total + section.chars, 0)
  let costUSD = 0
  let subagentCostUSD = 0
  for (const request of session.requests) {
    const cost = requestCostUSD(request, rates)
    costUSD += cost
    if (request.threadId !== MAIN_THREAD_ID) subagentCostUSD += cost
  }
  const mainModel = mostUsedModel(mainRequests.length > 0 ? mainRequests : session.requests)
  return {
    session,
    costUSD,
    mainRequests,
    mainModel,
    baselineTokens,
    tokensPerSectionChar: sectionChars > 0 ? baselineTokens / sectionChars : 1 / config.charsPerToken,
    peakContextTokens: Math.max(0, ...contextSizes),
    averageContextTokens: contextSizes.length > 0 ? contextSizes.reduce((total, size) => total + size, 0) / contextSizes.length : 0,
    cacheRebuilds: detectCacheRebuilds(session, mainRequests, rates),
    toolCalls: costToolCalls(session.toolCalls, mainModel, rates),
    subagentCostUSD,
  }
}
