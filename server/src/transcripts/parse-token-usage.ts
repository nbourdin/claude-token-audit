import type { TokenUsage } from '../model/session-summary.ts'
import { asNumber, readPath } from './json-access.ts'

export function parseTokenUsage(usage: unknown): TokenUsage {
  const cacheWriteTotal = asNumber(readPath(usage, 'cache_creation_input_tokens'))
  const cacheWrite1h = asNumber(readPath(usage, 'cache_creation', 'ephemeral_1h_input_tokens'))
  const cacheWrite5mDetailed = asNumber(readPath(usage, 'cache_creation', 'ephemeral_5m_input_tokens'))
  const hasDetail = cacheWrite1h + cacheWrite5mDetailed > 0
  return {
    input: asNumber(readPath(usage, 'input_tokens')),
    cacheWrite5m: hasDetail ? cacheWrite5mDetailed : cacheWriteTotal,
    cacheWrite1h: hasDetail ? cacheWrite1h : 0,
    cacheRead: asNumber(readPath(usage, 'cache_read_input_tokens')),
    output: asNumber(readPath(usage, 'output_tokens')),
    thinking: asNumber(readPath(usage, 'output_tokens_details', 'thinking_tokens')),
  }
}

export function parseReportedModelUsage(modelUsage: unknown): TokenUsage {
  const cacheWrite1h = asNumber(readPath(modelUsage, 'cacheCreationEphemeral1hInputTokens'))
  const cacheWrite5m = asNumber(readPath(modelUsage, 'cacheCreationEphemeral5mInputTokens'))
  const cacheWriteTotal = asNumber(readPath(modelUsage, 'cacheCreationInputTokens'))
  const hasDetail = cacheWrite1h + cacheWrite5m > 0
  return {
    input: asNumber(readPath(modelUsage, 'inputTokens')),
    cacheWrite5m: hasDetail ? cacheWrite5m : cacheWriteTotal,
    cacheWrite1h: hasDetail ? cacheWrite1h : 0,
    cacheRead: asNumber(readPath(modelUsage, 'cacheReadInputTokens')),
    output: asNumber(readPath(modelUsage, 'outputTokens')),
    thinking: asNumber(readPath(modelUsage, 'thinkingTokens')),
  }
}

export function contextTokensOf(usage: TokenUsage): number {
  return usage.input + usage.cacheWrite5m + usage.cacheWrite1h + usage.cacheRead
}
