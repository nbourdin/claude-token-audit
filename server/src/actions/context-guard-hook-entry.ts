import { config } from '../config.ts'
import type { JsonRecord } from '../transcripts/json-access.ts'
import { asArray, asRecord, asString } from '../transcripts/json-access.ts'

export const CONTEXT_GUARD_EVENT = 'UserPromptSubmit'

export type ContextGuardSettings = {
  contextThresholdTokens: number
  idleMinutes: number
  inputPricePerMillion: number
}

function quoteShellArgument(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

export function contextGuardCommand(settings: ContextGuardSettings): string {
  return [
    quoteShellArgument(process.execPath),
    quoteShellArgument(config.contextGuardScriptPath),
    '--threshold',
    String(settings.contextThresholdTokens),
    '--idle-minutes',
    String(settings.idleMinutes),
    '--price',
    String(settings.inputPricePerMillion),
    '--state',
    quoteShellArgument(config.guardStatePath),
  ].join(' ')
}

function entryRunsScript(entry: unknown, scriptPath: string): boolean {
  return asArray(asRecord(entry)?.['hooks']).some((hook) => asString(asRecord(hook)?.['command']).includes(scriptPath))
}

export function isContextGuardInstalled(settings: JsonRecord, scriptPath = config.contextGuardScriptPath): boolean {
  return asArray(asRecord(settings['hooks'])?.[CONTEXT_GUARD_EVENT]).some((entry) => entryRunsScript(entry, scriptPath))
}

export function withoutContextGuard(settings: JsonRecord, scriptPath: string): void {
  const hooks = asRecord(settings['hooks'])
  if (!hooks) return
  const remaining = asArray(hooks[CONTEXT_GUARD_EVENT]).filter((entry) => !entryRunsScript(entry, scriptPath))
  if (remaining.length > 0) hooks[CONTEXT_GUARD_EVENT] = remaining
  else delete hooks[CONTEXT_GUARD_EVENT]
}

export function withContextGuard(settings: JsonRecord, guardSettings: ContextGuardSettings): void {
  const hooks = asRecord(settings['hooks']) ?? {}
  const entries = asArray(hooks[CONTEXT_GUARD_EVENT])
  hooks[CONTEXT_GUARD_EVENT] = [...entries, { hooks: [{ type: 'command', command: contextGuardCommand(guardSettings), timeout: 5 }] }]
  settings['hooks'] = hooks
}
