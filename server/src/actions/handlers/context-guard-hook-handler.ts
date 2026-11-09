import { config } from '../../config.ts'
import type { ActionHandler } from '../action-types.ts'
import { isContextGuardInstalled, withContextGuard, withoutContextGuard } from '../context-guard-hook-entry.ts'
import { updateJsonRecord } from '../json-file.ts'

export const contextGuardHookHandler: ActionHandler = {
  apply(payload) {
    if (payload.kind !== 'context-guard-hook') throw new Error('unexpected payload')
    updateJsonRecord(config.claudeSettingsPath, (settings) => {
      if (isContextGuardInstalled(settings)) throw new Error('the context guard hook is already installed')
      withContextGuard(settings, payload)
    })
    return { kind: 'hook-entry', scriptPath: config.contextGuardScriptPath }
  },
  undo(record) {
    if (record.kind !== 'hook-entry') throw new Error('unexpected undo record')
    updateJsonRecord(config.claudeSettingsPath, (settings) => withoutContextGuard(settings, record.scriptPath))
  },
}
