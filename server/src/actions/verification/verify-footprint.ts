import { fixedContextCostUSD } from '../../analysis/detectors/detector-context.ts'
import { formatTokens } from '../../analysis/format.ts'
import type { ActionVerification, ContextFootprint } from '../action-types.ts'
import { footprintLeakHint } from './footprint-leak-hint.ts'
import { footprintTokens } from './footprint-tokens.ts'
import { isFootprintObservable } from './is-footprint-observable.ts'
import type { VerificationWindow } from './verification-window.ts'
import { toMonthlyRate } from './verification-window.ts'

const STILL_PRESENT_SHARE = 0.8

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : 0
}

function sessionsSince(count: number, preposition: 'dans' | 'de'): string {
  if (count === 1) return preposition === 'dans' ? 'dans la session démarrée depuis' : 'de la session démarrée depuis'
  return `${preposition === 'dans' ? 'dans les' : 'des'} ${count} sessions démarrées depuis`
}

function describe(footprint: ContextFootprint, label: string, counts: { observed: number; affected: number; beforeTokens: number; afterTokens: number }): string {
  const { observed, affected, beforeTokens, afterTokens } = counts
  if (footprint.kind === 'context-section') {
    const sizes = `~${formatTokens(afterTokens)} tokens depuis, contre ~${formatTokens(beforeTokens)} avant`
    if (affected === 0) return `${label} a maigri : ${sizes}.`
    return `${label} n’a pas (assez) maigri : ${sizes}.`
  }
  if (affected === 0) return `Aucune trace ${sessionsSince(observed, 'dans')} (${label}).`
  if (affected === observed) return `Toujours dans le contexte ${sessionsSince(observed, 'de')} (${label}).`
  return `Encore dans le contexte de ${affected} session${affected > 1 ? 's' : ''} sur ${observed} démarrées depuis (${label}).`
}

export function verifyFootprint(window: VerificationWindow, footprint: ContextFootprint, label: string): ActionVerification {
  const loadedBefore = window.before.map((metric) => ({ metric, tokens: footprintTokens(metric, footprint) })).filter(({ tokens }) => tokens > 0)
  const beforeTokens = average(loadedBefore.map(({ tokens }) => tokens))
  const projectsWithSection = new Set(loadedBefore.map(({ metric }) => metric.session.projectName))
  const afterSessions = window.after
    .filter((metric) => isFootprintObservable(metric, footprint, projectsWithSection))
    .map((metric) => ({ metric, tokens: footprintTokens(metric, footprint) }))
  const presenceThreshold = beforeTokens > 0 ? beforeTokens * STILL_PRESENT_SHARE : 0
  const affected = afterSessions.filter(({ tokens }) => tokens > presenceThreshold)
  const base = { observed: afterSessions.length, stillAffected: affected.length, observedUnit: 'session' as const, measuredOverDays: window.daysElapsed }
  if (afterSessions.length === 0) {
    return { ...base, status: 'waiting', detail: 'Aucune session démarrée depuis : la vérification se fera à la prochaine.', lastAffectedAt: null, measuredMonthlySavingUSD: null }
  }
  const avoidedCostUSD = afterSessions.reduce((total, { metric, tokens }) => total + fixedContextCostUSD(Math.max(0, beforeTokens - tokens), metric, window.rates), 0)
  const hint = affected.length > 0 ? footprintLeakHint(footprint, affected.map(({ metric }) => metric)) : null
  const detail = describe(footprint, label, { observed: afterSessions.length, affected: affected.length, beforeTokens, afterTokens: average(afterSessions.map(({ tokens }) => tokens)) })
  return {
    ...base,
    status: affected.length === 0 ? 'effective' : affected.length === afterSessions.length ? 'ineffective' : 'partial',
    detail: hint ? `${detail} Piste : ${hint}.` : detail,
    lastAffectedAt: affected.length > 0 ? Math.max(...affected.map(({ metric }) => metric.session.startedAt)) : null,
    measuredMonthlySavingUSD: beforeTokens > 0 ? toMonthlyRate(avoidedCostUSD, window.daysElapsed) : null,
  }
}
