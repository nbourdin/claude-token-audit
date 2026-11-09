import type { ModelRates } from '../cost/model-rates.ts'
import { cacheReadCostUSD, cacheWriteCostUSD } from '../cost/request-cost.ts'
import type { ContextFileCategory } from './context-file-category.ts'
import { canonicalContextFilePath, contextFileCategory, displayContextFilePath } from './context-file-category.ts'
import { fixedContextCostUSD } from './detectors/detector-context.ts'
import type { ContextFileOrigin } from './report-types.ts'
import type { SessionMetrics } from './session-metrics.ts'

export type ContextFileLoad = {
  path: string
  filePath: string
  category: ContextFileCategory
  origin: ContextFileOrigin
  tokens: number
  costUSD: number
}

type RawLoad = Omit<ContextFileLoad, 'path' | 'filePath' | 'category'> & { rawPath: string }

function rawLoadsOf(metric: SessionMetrics, rates: ModelRates): RawLoad[] {
  const { session, mainModel, tokensPerSectionChar } = metric
  const atStartup = session.contextSections.flatMap((section) => {
    if (section.filePath === undefined) return []
    const tokens = section.chars * tokensPerSectionChar
    return [{ rawPath: section.filePath, origin: 'startup' as const, tokens, costUSD: fixedContextCostUSD(tokens, metric, rates) }]
  })
  const injected = session.injectedFiles.map((file) => {
    const tokens = file.chars * tokensPerSectionChar
    return {
      rawPath: file.path,
      origin: 'nested' as const,
      tokens,
      costUSD: cacheWriteCostUSD(tokens, mainModel, rates) + cacheReadCostUSD(tokens * file.carriedRequests, mainModel, rates),
    }
  })
  const read = metric.toolCalls
    .filter((toolCall) => toolCall.name === 'Read')
    .map((toolCall) => ({ rawPath: toolCall.target, origin: 'read' as const, tokens: toolCall.resultTokens, costUSD: toolCall.costUSD }))
  return [...atStartup, ...injected, ...read]
}

export function contextFileLoads(metric: SessionMetrics, rates: ModelRates): ContextFileLoad[] {
  return rawLoadsOf(metric, rates).flatMap(({ rawPath, ...load }) => {
    const category = contextFileCategory(rawPath)
    return category ? [{ ...load, category, path: displayContextFilePath(rawPath), filePath: canonicalContextFilePath(rawPath) }] : []
  })
}
