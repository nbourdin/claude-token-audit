import type { ContextSection, UserPrompt } from '../model/session-summary.ts'
import type { CacheRebuild, CostedToolCall } from './session-metrics.ts'

export type TimelinePoint = {
  at: number
  contextTokens: number
  cacheWriteTokens: number
  outputTokens: number
  costUSD: number
}

export type SubagentRun = {
  threadId: string
  agentType: string
  description: string
  requests: number
  costUSD: number
  peakContextTokens: number
}

export type SessionDetail = {
  sessionId: string
  title: string
  projectName: string
  worktree: string | null
  gitBranch: string
  cwd: string
  cliVersion: string
  startedAt: number
  endedAt: number
  costUSD: number
  mainModel: string
  baselineTokens: number
  peakContextTokens: number
  averageContextTokens: number
  userPrompts: UserPrompt[]
  compactionsAt: number[]
  timeline: TimelinePoint[]
  cacheRebuilds: CacheRebuild[]
  contextSections: Array<ContextSection & { tokens: number }>
  toolCalls: CostedToolCall[]
  toolCallCount: number
  subagentRuns: SubagentRun[]
}
