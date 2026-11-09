import type { ModelRates } from '../cost/model-rates.ts'
import { cacheReadCostUSD, cacheWriteCostUSD } from '../cost/request-cost.ts'
import { fixedContextCostUSD } from './detectors/detector-context.ts'
import type { ContextFileCategory } from './context-file-category.ts'
import { OVERSIZE_THRESHOLD_TOKENS, contextFileCategory, displayContextFilePath } from './context-file-category.ts'
import type { ContextFileAggregate, ContextFileOrigin } from './report-types.ts'
import type { SessionMetrics } from './session-metrics.ts'

type FileLoad = { path: string; origin: ContextFileOrigin; tokens: number; costUSD: number }

function loadsOf(metric: SessionMetrics, rates: ModelRates): FileLoad[] {
  const { session, mainModel, tokensPerSectionChar } = metric
  const atStartup = session.contextSections
    .filter((section) => section.filePath !== undefined)
    .map((section) => {
      const tokens = section.chars * tokensPerSectionChar
      return { path: section.filePath ?? '', origin: 'startup' as const, tokens, costUSD: fixedContextCostUSD(tokens, metric, rates) }
    })
  const injected = session.injectedFiles.map((file) => {
    const tokens = file.chars * tokensPerSectionChar
    return {
      path: file.path,
      origin: 'nested' as const,
      tokens,
      costUSD: cacheWriteCostUSD(tokens, mainModel, rates) + cacheReadCostUSD(tokens * file.carriedRequests, mainModel, rates),
    }
  })
  const read = metric.toolCalls
    .filter((toolCall) => toolCall.name === 'Read')
    .map((toolCall) => ({ path: toolCall.target, origin: 'read' as const, tokens: toolCall.resultTokens, costUSD: toolCall.costUSD }))
  return [...atStartup, ...injected, ...read]
}

type Accumulator = { path: string; category: ContextFileCategory; origins: Set<ContextFileOrigin>; sessions: Set<string>; loads: number; totalTokens: number; maxTokens: number; costUSD: number }

export function buildContextFiles(metrics: SessionMetrics[], rates: ModelRates): ContextFileAggregate[] {
  const files = new Map<string, Accumulator>()
  for (const metric of metrics) {
    for (const load of loadsOf(metric, rates)) {
      const category = contextFileCategory(load.path)
      if (!category) continue
      const path = displayContextFilePath(load.path)
      const entry = files.get(path) ?? { path, category, origins: new Set(), sessions: new Set(), loads: 0, totalTokens: 0, maxTokens: 0, costUSD: 0 }
      entry.origins.add(load.origin)
      entry.sessions.add(metric.session.sessionId)
      entry.loads += 1
      entry.totalTokens += load.tokens
      entry.maxTokens = Math.max(entry.maxTokens, load.tokens)
      entry.costUSD += load.costUSD
      files.set(path, entry)
    }
  }
  return [...files.values()]
    .map((entry) => {
      const averageTokens = entry.totalTokens / entry.loads
      const thresholdTokens = OVERSIZE_THRESHOLD_TOKENS[entry.category]
      return {
        path: entry.path,
        category: entry.category,
        origins: [...entry.origins].sort(),
        sessions: entry.sessions.size,
        loads: entry.loads,
        averageTokens,
        maxTokens: entry.maxTokens,
        costUSD: entry.costUSD,
        thresholdTokens,
        isOversized: averageTokens >= thresholdTokens,
      }
    })
    .sort((left, right) => right.costUSD - left.costUSD)
}
