import type { TokenUsage } from '../model/session-summary.ts'

export const TOKEN_PRICE_MULTIPLIERS = {
  input: 1,
  cacheWrite5m: 1.25,
  cacheWrite1h: 2,
  cacheRead: 0.1,
  output: 5,
} as const

export function weightedTokens(usage: TokenUsage): number {
  return (
    usage.input * TOKEN_PRICE_MULTIPLIERS.input +
    usage.cacheWrite5m * TOKEN_PRICE_MULTIPLIERS.cacheWrite5m +
    usage.cacheWrite1h * TOKEN_PRICE_MULTIPLIERS.cacheWrite1h +
    usage.cacheRead * TOKEN_PRICE_MULTIPLIERS.cacheRead +
    usage.output * TOKEN_PRICE_MULTIPLIERS.output
  )
}

export function normalizeModelName(model: string): string {
  return model.replace(/\[.*\]$/, '')
}
