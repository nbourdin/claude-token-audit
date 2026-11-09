import type { SessionMetrics } from '../../analysis/session-metrics.ts'
import { requestCostUSD } from '../../cost/request-cost.ts'
import type { ApiRequest } from '../../model/session-summary.ts'
import type { ActionVerification } from '../action-types.ts'
import type { VerificationWindow } from './verification-window.ts'
import { toMonthlyRate } from './verification-window.ts'

type AgentRun = { startedAt: number; model: string; requests: ApiRequest[] }

function agentRuns(metrics: SessionMetrics[], agentType: string): AgentRun[] {
  return metrics.flatMap(({ session }) =>
    session.subagents
      .filter((subagent) => subagent.agentType === agentType)
      .map((subagent) => session.requests.filter((request) => request.threadId === subagent.threadId))
      .filter((requests) => requests.length > 0)
      .map((requests) => ({ startedAt: requests[0]!.at, model: requests[0]!.model, requests })),
  )
}

function mostCommonModel(runs: AgentRun[]): string | null {
  const counts = new Map<string, number>()
  for (const run of runs) counts.set(run.model, (counts.get(run.model) ?? 0) + 1)
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null
}

function runCount(count: number): string {
  return `${count} exécution${count > 1 ? 's' : ''}`
}

export function verifyAgentModel(window: VerificationWindow, agentType: string, targetModel: string): ActionVerification {
  const runs = agentRuns(window.after, agentType)
  const affected = runs.filter((run) => !run.model.includes(targetModel))
  const previousModel = mostCommonModel(agentRuns(window.before, agentType))
  const base = { observed: runs.length, stillAffected: affected.length, observedUnit: 'run' as const, measuredOverDays: window.daysElapsed }
  if (runs.length === 0) {
    return { ...base, status: 'waiting', detail: `Pas encore d’exécution de « ${agentType} » depuis.`, lastAffectedAt: null, measuredMonthlySavingUSD: null }
  }
  const avoidedCostUSD = previousModel
    ? runs
        .filter((run) => run.model.includes(targetModel))
        .flatMap((run) => run.requests)
        .reduce((total, request) => total + requestCostUSD({ ...request, model: previousModel }, window.rates) - requestCostUSD(request, window.rates), 0)
    : 0
  const detail =
    affected.length === 0
      ? `Les ${runCount(runs.length)} depuis tournent sur ${targetModel}.`
      : `${runCount(affected.length)} sur ${runs.length} tournent encore sur ${affected[0]!.model}. Piste : un appel qui force le modèle, ou une autre définition de l’agent prend le pas sur le fichier modifié.`
  return {
    ...base,
    status: affected.length === 0 ? 'effective' : affected.length === runs.length ? 'ineffective' : 'partial',
    detail,
    lastAffectedAt: affected.length > 0 ? Math.max(...affected.map((run) => run.startedAt)) : null,
    measuredMonthlySavingUSD: previousModel ? toMonthlyRate(avoidedCostUSD, window.daysElapsed) : null,
  }
}
