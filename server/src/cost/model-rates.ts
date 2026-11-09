import type { SessionSummary } from '../model/session-summary.ts'
import { normalizeModelName, weightedTokens } from './token-weights.ts'

export type ModelRates = {
  inputPriceFor(model: string): number
  calibratedModels: Array<{ model: string; inputPricePerMillion: number; source: 'reported' | 'family-default' }>
}

const FAMILY_DEFAULT_INPUT_PRICE: Array<{ pattern: RegExp; pricePerToken: number }> = [
  { pattern: /opus/i, pricePerToken: 5 / 1_000_000 },
  { pattern: /sonnet/i, pricePerToken: 3 / 1_000_000 },
  { pattern: /haiku/i, pricePerToken: 1 / 1_000_000 },
]
const UNKNOWN_MODEL_PRICE = 3 / 1_000_000
const MINIMUM_CALIBRATION_WEIGHT = 100_000

function familyDefaultPrice(model: string): number {
  return FAMILY_DEFAULT_INPUT_PRICE.find(({ pattern }) => pattern.test(model))?.pricePerToken ?? UNKNOWN_MODEL_PRICE
}

export function calibrateModelRates(sessions: SessionSummary[]): ModelRates {
  const totals = new Map<string, { costUSD: number; weight: number }>()
  for (const session of sessions) {
    for (const reported of session.reportedModelUsage) {
      const model = normalizeModelName(reported.model)
      const total = totals.get(model) ?? { costUSD: 0, weight: 0 }
      total.costUSD += reported.costUSD
      total.weight += weightedTokens(reported.usage)
      totals.set(model, total)
    }
  }
  const reportedPrices = new Map<string, number>()
  for (const [model, total] of totals) {
    if (total.weight >= MINIMUM_CALIBRATION_WEIGHT && total.costUSD > 0) reportedPrices.set(model, total.costUSD / total.weight)
  }
  const usedModels = new Set(sessions.flatMap((session) => session.requests.map((request) => normalizeModelName(request.model))))
  const priceCache = new Map<string, number>()
  function inputPriceFor(model: string): number {
    const normalized = normalizeModelName(model)
    const cached = priceCache.get(normalized)
    if (cached !== undefined) return cached
    const price = reportedPrices.get(normalized) ?? familyDefaultPrice(normalized)
    priceCache.set(normalized, price)
    return price
  }
  const calibratedModels = [...usedModels].sort().map((model) => ({
    model,
    inputPricePerMillion: inputPriceFor(model) * 1_000_000,
    source: reportedPrices.has(model) ? ('reported' as const) : ('family-default' as const),
  }))
  return { inputPriceFor, calibratedModels }
}
