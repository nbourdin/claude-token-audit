import type { ModelRates } from '../cost/model-rates.ts'
import type { CostBreakdown } from '../cost/request-cost.ts'
import { requestCostBreakdown } from '../cost/request-cost.ts'
import { normalizeModelName } from '../cost/token-weights.ts'
import { sum } from './format.ts'
import type { BaselineSectionAggregate, DailyCost, ModelSummary, ProjectCost, ReportTotals, ToolAggregate } from './report-types.ts'
import type { SessionMetrics } from './session-metrics.ts'
import { mcpServerOf } from './tool-server-name.ts'
import { fixedContextCostUSD } from './detectors/detector-context.ts'

function localDay(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

export function buildTotals(metrics: SessionMetrics[]): ReportTotals {
  const requests = metrics.flatMap((metric) => metric.session.requests)
  const cacheReadTokens = sum(requests, (request) => request.usage.cacheRead)
  const cacheWriteTokens = sum(requests, (request) => request.usage.cacheWrite5m + request.usage.cacheWrite1h)
  const uncachedInputTokens = sum(requests, (request) => request.usage.input)
  const costUSD = sum(metrics, (metric) => metric.costUSD)
  const userPrompts = sum(metrics, (metric) => metric.session.userPrompts.length)
  const withBaseline = metrics.filter((metric) => metric.baselineTokens > 0)
  return {
    costUSD,
    sessions: metrics.length,
    requests: requests.length,
    userPrompts,
    outputTokens: sum(requests, (request) => request.usage.output),
    cacheReadTokens,
    cacheWriteTokens,
    uncachedInputTokens,
    cacheHitRatio: cacheReadTokens / Math.max(1, cacheReadTokens + cacheWriteTokens + uncachedInputTokens),
    averageBaselineTokens: sum(withBaseline, (metric) => metric.baselineTokens) / Math.max(1, withBaseline.length),
    medianPeakContextTokens: median(metrics.map((metric) => metric.peakContextTokens)),
    costPerUserPromptUSD: costUSD / Math.max(1, userPrompts),
  }
}

export function buildCostComposition(metrics: SessionMetrics[], rates: ModelRates): CostBreakdown {
  const composition: CostBreakdown = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0, total: 0 }
  for (const metric of metrics) {
    for (const request of metric.session.requests) {
      const breakdown = requestCostBreakdown(request, rates)
      composition.input += breakdown.input
      composition.cacheWrite += breakdown.cacheWrite
      composition.cacheRead += breakdown.cacheRead
      composition.output += breakdown.output
      composition.total += breakdown.total
    }
  }
  return composition
}

export function buildDailyCosts(metrics: SessionMetrics[], rates: ModelRates): DailyCost[] {
  const days = new Map<string, DailyCost>()
  for (const metric of metrics) {
    for (const request of metric.session.requests) {
      const day = localDay(request.at)
      const entry = days.get(day) ?? { day, costByModel: {}, totalUSD: 0 }
      const cost = requestCostBreakdown(request, rates).total
      const model = normalizeModelName(request.model)
      entry.costByModel[model] = (entry.costByModel[model] ?? 0) + cost
      entry.totalUSD += cost
      days.set(day, entry)
    }
  }
  return [...days.values()].sort((left, right) => left.day.localeCompare(right.day))
}

export function buildProjectCosts(metrics: SessionMetrics[]): ProjectCost[] {
  const projects = new Map<string, ProjectCost>()
  for (const metric of metrics) {
    const entry = projects.get(metric.session.projectName) ?? { projectName: metric.session.projectName, costUSD: 0, sessions: 0 }
    entry.costUSD += metric.costUSD
    entry.sessions += 1
    projects.set(metric.session.projectName, entry)
  }
  return [...projects.values()].sort((left, right) => right.costUSD - left.costUSD)
}

export function buildModelSummaries(metrics: SessionMetrics[], rates: ModelRates): ModelSummary[] {
  return rates.calibratedModels
    .map((calibrated) => {
      const requests = metrics.flatMap((metric) => metric.session.requests).filter((request) => normalizeModelName(request.model) === calibrated.model)
      return {
        model: calibrated.model,
        costUSD: sum(requests, (request) => requestCostBreakdown(request, rates).total),
        requests: requests.length,
        inputPricePerMillion: calibrated.inputPricePerMillion,
        priceSource: calibrated.source,
      }
    })
    .filter((summary) => summary.requests > 0)
    .sort((left, right) => right.costUSD - left.costUSD)
}

export function buildToolAggregates(metrics: SessionMetrics[]): ToolAggregate[] {
  const tools = new Map<string, ToolAggregate>()
  for (const metric of metrics) {
    for (const toolCall of metric.toolCalls) {
      const entry = tools.get(toolCall.name) ?? {
        name: toolCall.name,
        server: mcpServerOf(toolCall.name),
        calls: 0,
        errors: 0,
        resultTokens: 0,
        carriedTokens: 0,
        costUSD: 0,
      }
      entry.calls += 1
      entry.errors += toolCall.isError ? 1 : 0
      entry.resultTokens += toolCall.resultTokens
      entry.carriedTokens += toolCall.carriedTokens
      entry.costUSD += toolCall.costUSD
      tools.set(toolCall.name, entry)
    }
  }
  return [...tools.values()].sort((left, right) => right.costUSD - left.costUSD)
}

export function buildBaselineSections(metrics: SessionMetrics[], rates: ModelRates): BaselineSectionAggregate[] {
  const sections = new Map<string, BaselineSectionAggregate & { totalTokens: number }>()
  for (const metric of metrics) {
    for (const section of metric.session.contextSections) {
      const key = `${section.kind}:${section.label}`
      const tokens = section.chars * metric.tokensPerSectionChar
      const entry = sections.get(key) ?? { label: section.label, kind: section.kind, averageTokens: 0, sessions: 0, costUSD: 0, totalTokens: 0 }
      entry.totalTokens += tokens
      entry.sessions += 1
      entry.costUSD += fixedContextCostUSD(tokens, metric, rates)
      sections.set(key, entry)
    }
  }
  return [...sections.values()]
    .map(({ totalTokens, ...entry }) => ({ ...entry, averageTokens: totalTokens / entry.sessions }))
    .sort((left, right) => right.costUSD - left.costUSD)
}
