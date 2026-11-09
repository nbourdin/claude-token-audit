import type { ApiRequest, SessionSummary } from '../model/session-summary.ts'
import { MAIN_THREAD_ID } from '../model/session-summary.ts'
import { mergeSections } from './split-context-sections.ts'
import { resolveProject } from './resolve-project.ts'
import type { SessionBuilder } from './session-builder.ts'

function countLaterRequests(sortedTimes: number[], after: number, before: number): number {
  let low = 0
  let high = sortedTimes.length
  while (low < high) {
    const middle = (low + high) >> 1
    if (sortedTimes[middle]! <= after) low = middle + 1
    else high = middle
  }
  let count = 0
  for (let index = low; index < sortedTimes.length && sortedTimes[index]! < before; index += 1) count += 1
  return count
}

function nextCompactionAfter(compactionsAt: number[], at: number): number {
  return compactionsAt.find((compactionAt) => compactionAt > at) ?? Number.POSITIVE_INFINITY
}

function withCarriedRequests<Item extends { at: number; threadId: string }>(items: Item[], requests: ApiRequest[], compactionsAt: number[]): Array<Item & { carriedRequests: number }> {
  const timesByThread = new Map<string, number[]>()
  for (const request of requests) {
    const times = timesByThread.get(request.threadId) ?? []
    times.push(request.at)
    timesByThread.set(request.threadId, times)
  }
  return items.map((item) => {
    const times = timesByThread.get(item.threadId) ?? []
    const before = item.threadId === MAIN_THREAD_ID ? nextCompactionAfter(compactionsAt, item.at) : Number.POSITIVE_INFINITY
    return { ...item, carriedRequests: countLaterRequests(times, item.at, before) }
  })
}

export function finalizeSession(builder: SessionBuilder): SessionSummary | null {
  const requests = [...builder.requestsByMessageId.values()].sort((left, right) => left.at - right.at)
  if (requests.length === 0) return null
  const compactionsAt = builder.compactionsAt.sort((left, right) => left - right)
  const { projectName, worktree } = resolveProject(builder.cwd)
  return {
    sessionId: builder.sessionId,
    sourceFile: builder.sourceFile,
    projectName,
    cwd: builder.cwd,
    worktree,
    title: builder.title || builder.fallbackTitle || builder.sessionId.slice(0, 8),
    gitBranch: builder.gitBranch,
    entrypoint: builder.entrypoint,
    cliVersion: builder.cliVersion,
    startedAt: builder.startedAt,
    endedAt: builder.endedAt,
    requests,
    toolCalls: withCarriedRequests([...builder.toolCallsById.values()], requests, compactionsAt),
    injectedFiles: withCarriedRequests(builder.injectedFiles, requests, compactionsAt),
    subagents: builder.subagents,
    contextSections: mergeSections(builder.contextSections),
    toolDefinitions: builder.toolDefinitions,
    listedSkills: builder.listedSkills,
    deferredTools: builder.deferredTools,
    shapeChanges: builder.shapeChanges,
    compactionsAt,
    apiErrors: builder.apiErrors,
    userPrompts: builder.userPrompts,
    reportedModelUsage: builder.reportedModelUsage,
  }
}
