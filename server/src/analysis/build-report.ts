import { calibrateModelRates } from '../cost/model-rates.ts'
import type { SessionSummary } from '../model/session-summary.ts'
import {
  buildBaselineSections,
  buildCostComposition,
  buildDailyCosts,
  buildModelSummaries,
  buildProjectCosts,
  buildToolAggregates,
  buildTotals,
} from './build-overview.ts'
import { buildContextFiles } from './build-context-files.ts'
import { allDetectors } from './detectors/all-detectors.ts'
import { filterSessions } from './filter-sessions.ts'
import { sum } from './format.ts'
import type { AuditReport, Finding, ReportFilter, SessionRow } from './report-types.ts'
import type { SessionMetrics } from './session-metrics.ts'
import { computeSessionMetrics } from './session-metrics.ts'

function toSessionRow(metric: SessionMetrics): SessionRow {
  const { session } = metric
  return {
    sessionId: session.sessionId,
    title: session.title,
    projectName: session.projectName,
    worktree: session.worktree,
    gitBranch: session.gitBranch,
    startedAt: session.startedAt,
    durationMinutes: (session.endedAt - session.startedAt) / 60_000,
    costUSD: metric.costUSD,
    requests: session.requests.length,
    userPrompts: session.userPrompts.length,
    toolCalls: session.toolCalls.length,
    peakContextTokens: metric.peakContextTokens,
    averageContextTokens: metric.averageContextTokens,
    baselineTokens: metric.baselineTokens,
    cacheRebuildCostUSD: sum(metric.cacheRebuilds, (rebuild) => rebuild.extraCostUSD),
    subagentCostUSD: metric.subagentCostUSD,
    mainModel: metric.mainModel,
  }
}

export function buildReport(allSessions: SessionSummary[], filter: ReportFilter): AuditReport {
  const rates = calibrateModelRates(allSessions)
  const metrics = filterSessions(allSessions, filter).map((session) => computeSessionMetrics(session, rates))
  const totals = buildTotals(metrics)
  const context = { metrics, rates, totalCostUSD: totals.costUSD }
  const findings = allDetectors
    .map((detector) => detector(context))
    .filter((finding): finding is Finding => finding !== null)
    .sort((left, right) => right.impactUSD - left.impactUSD)
  return {
    generatedAt: Date.now(),
    filter,
    availableProjects: [...new Set(allSessions.map((session) => session.projectName))].sort(),
    totals,
    costComposition: buildCostComposition(metrics, rates),
    dailyCosts: buildDailyCosts(metrics, rates),
    projectCosts: buildProjectCosts(metrics),
    models: buildModelSummaries(metrics, rates),
    baselineSections: buildBaselineSections(metrics, rates).slice(0, 25),
    contextFiles: buildContextFiles(metrics, rates).slice(0, 60),
    tools: buildToolAggregates(metrics).slice(0, 40),
    findings,
    sessions: metrics.map(toSessionRow).sort((left, right) => right.startedAt - left.startedAt),
  }
}
