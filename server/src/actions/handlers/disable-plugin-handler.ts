import { config } from '../../config.ts'
import { asRecord } from '../../transcripts/json-access.ts'
import type { ActionHandler } from '../action-types.ts'
import { updateJsonRecord } from '../json-file.ts'

export const disablePluginHandler: ActionHandler = {
  apply(payload) {
    if (payload.kind !== 'disable-plugin') throw new Error('unexpected payload')
    let previousValue: unknown = null
    updateJsonRecord(config.claudeSettingsPath, (settings) => {
      const enabledPlugins = asRecord(settings['enabledPlugins']) ?? {}
      previousValue = enabledPlugins[payload.pluginId] ?? null
      enabledPlugins[payload.pluginId] = false
      settings['enabledPlugins'] = enabledPlugins
    })
    return { kind: 'plugin-enabled', pluginId: payload.pluginId, previousValue }
  },
  undo(record) {
    if (record.kind !== 'plugin-enabled') throw new Error('unexpected undo record')
    updateJsonRecord(config.claudeSettingsPath, (settings) => {
      const enabledPlugins = asRecord(settings['enabledPlugins']) ?? {}
      if (record.previousValue === null) delete enabledPlugins[record.pluginId]
      else enabledPlugins[record.pluginId] = record.previousValue
      settings['enabledPlugins'] = enabledPlugins
    })
  },
}
