import { contextFileLoads } from '../../analysis/context-file-loads.ts'
import { formatTokens } from '../../analysis/format.ts'
import type { SessionMetrics } from '../../analysis/session-metrics.ts'
import type { ActionVerification } from '../action-types.ts'
import type { VerificationWindow } from './verification-window.ts'
import { toMonthlyRate } from './verification-window.ts'

const STILL_OVERSIZED_SHARE = 0.8

function loadsOfFile(metrics: SessionMetrics[], path: string, window: VerificationWindow) {
  return metrics.flatMap((metric) =>
    contextFileLoads(metric, window.rates)
      .filter((load) => load.path === path)
      .map((load) => ({ ...load, startedAt: metric.session.startedAt })),
  )
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : 0
}

export function verifyContextFile(window: VerificationWindow, path: string, thresholdTokens: number): ActionVerification {
  const beforeTokens = average(loadsOfFile(window.before, path, window).map((load) => load.tokens))
  const afterLoads = loadsOfFile(window.after, path, window)
  const base = { observed: afterLoads.length, observedUnit: 'load' as const, measuredOverDays: window.daysElapsed }
  if (afterLoads.length === 0) {
    return { ...base, stillAffected: 0, status: 'waiting', detail: `${path} n’a pas encore été chargé depuis.`, lastAffectedAt: null, measuredMonthlySavingUSD: null }
  }
  const afterTokens = average(afterLoads.map((load) => load.tokens))
  const shrinkTarget = beforeTokens > 0 ? Math.max(thresholdTokens, beforeTokens * STILL_OVERSIZED_SHARE) : thresholdTokens
  const affected = afterLoads.filter((load) => load.tokens > shrinkTarget)
  const avoidedCostUSD = afterLoads.reduce((total, load) => total + (load.tokens > 0 ? load.costUSD * Math.max(0, beforeTokens / load.tokens - 1) : 0), 0)
  const sizes = `~${formatTokens(afterTokens)} tokens par chargement depuis, contre ~${formatTokens(beforeTokens)} avant (cible ${formatTokens(thresholdTokens)})`
  return {
    ...base,
    stillAffected: affected.length,
    status: affected.length === 0 ? 'effective' : affected.length === afterLoads.length ? 'ineffective' : 'partial',
    detail: affected.length === 0 ? `Fichier allégé : ${sizes}.` : `Pas (assez) allégé : ${sizes}. Si tu l’as modifié dans un worktree, la branche n’est peut-être pas encore mergée.`,
    lastAffectedAt: affected.length > 0 ? Math.max(...affected.map((load) => load.startedAt)) : null,
    measuredMonthlySavingUSD: beforeTokens > 0 ? toMonthlyRate(avoidedCostUSD, window.daysElapsed) : null,
  }
}
