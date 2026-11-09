import type { ApiRequest } from '../model/session-summary.ts'
import type { ModelRates } from './model-rates.ts'
import { TOKEN_PRICE_MULTIPLIERS, weightedTokens } from './token-weights.ts'

export type CostBreakdown = {
  input: number
  cacheWrite: number
  cacheRead: number
  output: number
  total: number
}

export function requestCostUSD(request: ApiRequest, rates: ModelRates): number {
  return weightedTokens(request.usage) * rates.inputPriceFor(request.model)
}

export function requestCostBreakdown(request: ApiRequest, rates: ModelRates): CostBreakdown {
  const price = rates.inputPriceFor(request.model)
  const { usage } = request
  const input = usage.input * TOKEN_PRICE_MULTIPLIERS.input * price
  const cacheWrite = (usage.cacheWrite5m * TOKEN_PRICE_MULTIPLIERS.cacheWrite5m + usage.cacheWrite1h * TOKEN_PRICE_MULTIPLIERS.cacheWrite1h) * price
  const cacheRead = usage.cacheRead * TOKEN_PRICE_MULTIPLIERS.cacheRead * price
  const output = usage.output * TOKEN_PRICE_MULTIPLIERS.output * price
  return { input, cacheWrite, cacheRead, output, total: input + cacheWrite + cacheRead + output }
}

export function cacheReadCostUSD(tokens: number, model: string, rates: ModelRates): number {
  return tokens * TOKEN_PRICE_MULTIPLIERS.cacheRead * rates.inputPriceFor(model)
}

export function cacheWriteCostUSD(tokens: number, model: string, rates: ModelRates): number {
  return tokens * TOKEN_PRICE_MULTIPLIERS.cacheWrite1h * rates.inputPriceFor(model)
}
