import type { ActionVerification, AppliedAction, VerificationTarget } from '../action-types.ts'
import { config } from '../../config.ts'
import { isContextGuardInstalled } from '../context-guard-hook-entry.ts'
import { readJsonRecord } from '../json-file.ts'
import { verifyAgentModel } from './verify-agent-model.ts'
import { verifyFootprint } from './verify-footprint.ts'
import type { VerificationWindow } from './verification-window.ts'

function withoutMeasure(window: VerificationWindow, status: ActionVerification['status'], detail: string): ActionVerification {
  return {
    status,
    detail,
    observed: window.after.length,
    stillAffected: 0,
    observedUnit: 'session',
    lastAffectedAt: null,
    measuredMonthlySavingUSD: null,
    measuredOverDays: window.daysElapsed,
  }
}

function verifyContextGuard(window: VerificationWindow, applied: AppliedAction): ActionVerification {
  const scriptPath = applied.undo.kind === 'hook-entry' ? applied.undo.scriptPath : config.contextGuardScriptPath
  return isContextGuardInstalled(readJsonRecord(config.claudeSettingsPath), scriptPath)
    ? withoutMeasure(window, 'in-place', 'Le hook est en place dans ~/.claude/settings.json. Il agit sur tes habitudes : son effet se lit dans Avant / après (contexte moyen, cache réécrit).')
    : withoutMeasure(window, 'missing', 'Le hook n’est plus dans ~/.claude/settings.json : il a été retiré en dehors de l’outil.')
}

export function verifyAppliedAction(window: VerificationWindow, target: VerificationTarget): ActionVerification {
  if (window.applied.undoneAt !== null) return withoutMeasure(window, 'undone', 'Action annulée.')
  switch (target.kind) {
    case 'footprint':
      return verifyFootprint(window, target.footprint, target.label)
    case 'agent-model':
      return verifyAgentModel(window, target.agentType, target.model)
    case 'context-guard-hook':
      return verifyContextGuard(window, window.applied)
    case 'none':
      return withoutMeasure(window, 'not-verifiable', 'Pas de trace directe dans les transcripts : l’effet se lit dans Avant / après.')
  }
}
