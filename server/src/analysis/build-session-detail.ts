import { calibrateModelRates } from '../cost/model-rates.ts'
import { requestCostUSD } from '../cost/request-cost.ts'
import type { SessionSummary } from '../model/session-summary.ts'
import { MAIN_THREAD_ID } from '../model/session-summary.ts'
import { sum } from './format.ts'
import type { SessionDetail } from './session-detail-types.ts'
import { computeSessionMetrics } from './session-metrics.ts'

export function buildSessionDetail(allSessions: SessionSummary[], sessionId: string): SessionDetail | null {
  const session = allSessions.find((candidate) => candidate.sessionId === sessionId)
  if (!session) return null
  const rates = calibrateModelRates(allSessions)
  const metrics = computeSessionMetrics(session, rates)
  const agentTypeByThread = new Map(session.subagents.map((subagent) => [subagent.threadId, subagent]))
  const subagentRuns = [...new Set(session.requests.filter((request) => request.threadId !== MAIN_THREAD_ID).map((request) => request.threadId))].map(
    (threadId) => {
      const requests = session.requests.filter((request) => request.threadId === threadId)
      return {
        threadId,
        agentType: agentTypeByThread.get(threadId)?.agentType ?? 'unknown',
        description: agentTypeByThread.get(threadId)?.description ?? '',
        requests: requests.length,
        costUSD: sum(requests, (request) => requestCostUSD(request, rates)),
        peakContextTokens: Math.max(0, ...requests.map((request) => request.contextTokens)),
      }
    },
  )
  return {
    sessionId: session.sessionId,
    title: session.title,
    projectName: session.projectName,
    worktree: session.worktree,
    gitBranch: session.gitBranch,
    cwd: session.cwd,
    cliVersion: session.cliVersion,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    costUSD: metrics.costUSD,
    mainModel: metrics.mainModel,
    baselineTokens: metrics.baselineTokens,
    peakContextTokens: metrics.peakContextTokens,
    averageContextTokens: metrics.averageContextTokens,
    userPrompts: session.userPrompts,
    compactionsAt: session.compactionsAt,
    timeline: metrics.mainRequests.map((request) => ({
      at: request.at,
      contextTokens: request.contextTokens,
      cacheWriteTokens: request.usage.cacheWrite5m + request.usage.cacheWrite1h,
      outputTokens: request.usage.output,
      costUSD: requestCostUSD(request, rates),
    })),
    cacheRebuilds: metrics.cacheRebuilds,
    contextSections: session.contextSections
      .map((section) => ({ ...section, tokens: section.chars * metrics.tokensPerSectionChar }))
      .sort((left, right) => right.tokens - left.tokens),
    toolCalls: [...metrics.toolCalls].sort((left, right) => right.costUSD - left.costUSD).slice(0, 60),
    toolCallCount: metrics.toolCalls.length,
    subagentRuns: subagentRuns.sort((left, right) => right.costUSD - left.costUSD),
  }
}
