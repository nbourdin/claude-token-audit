import type { ModelRates } from '../cost/model-rates.ts'
import type { ContextFileCategory } from './context-file-category.ts'
import { OVERSIZE_THRESHOLD_TOKENS } from './context-file-category.ts'
import { contextFileLoads } from './context-file-loads.ts'
import type { ContextFileAggregate, ContextFileOrigin } from './report-types.ts'
import type { SessionMetrics } from './session-metrics.ts'

const ORIGIN_ORDER: ContextFileOrigin[] = ['startup', 'nested', 'read']

type Accumulator = {
  path: string
  filePath: string
  category: ContextFileCategory
  origins: Set<ContextFileOrigin>
  sessions: Set<string>
  loads: number
  totalTokens: number
  maxTokens: number
  costUSD: number
}

export function buildContextFiles(metrics: SessionMetrics[], rates: ModelRates): ContextFileAggregate[] {
  const files = new Map<string, Accumulator>()
  for (const metric of metrics) {
    for (const load of contextFileLoads(metric, rates)) {
      const entry = files.get(load.path) ?? {
        path: load.path,
        filePath: load.filePath,
        category: load.category,
        origins: new Set(),
        sessions: new Set(),
        loads: 0,
        totalTokens: 0,
        maxTokens: 0,
        costUSD: 0,
      }
      entry.origins.add(load.origin)
      entry.sessions.add(metric.session.sessionId)
      entry.loads += 1
      entry.totalTokens += load.tokens
      entry.maxTokens = Math.max(entry.maxTokens, load.tokens)
      entry.costUSD += load.costUSD
      files.set(load.path, entry)
    }
  }
  return [...files.values()]
    .map((entry) => {
      const averageTokens = entry.totalTokens / entry.loads
      const thresholdTokens = OVERSIZE_THRESHOLD_TOKENS[entry.category]
      return {
        path: entry.path,
        filePath: entry.filePath,
        category: entry.category,
        origins: ORIGIN_ORDER.filter((origin) => entry.origins.has(origin)),
        sessions: entry.sessions.size,
        loads: entry.loads,
        averageTokens,
        maxTokens: entry.maxTokens,
        costUSD: entry.costUSD,
        thresholdTokens,
        isOversized: averageTokens >= thresholdTokens,
        excessCostUSD: averageTokens > thresholdTokens ? entry.costUSD * (1 - thresholdTokens / averageTokens) : 0,
      }
    })
    .sort((left, right) => right.costUSD - left.costUSD)
}
