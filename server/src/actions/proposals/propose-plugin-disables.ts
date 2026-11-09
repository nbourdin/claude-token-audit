import { fixedContextCostUSD } from '../../analysis/detectors/detector-context.ts'
import { config } from '../../config.ts'
import { asRecord } from '../../transcripts/json-access.ts'
import type { ProposedAction } from '../action-types.ts'
import { readJsonRecord } from '../json-file.ts'
import type { ProposalContext } from './proposal-context.ts'

function pluginNameOf(pluginId: string): string {
  return pluginId.split('@')[0] ?? pluginId
}

export function proposePluginDisables({ allSessions, recentMetrics, rates }: ProposalContext): ProposedAction[] {
  const enabledPlugins = Object.entries(asRecord(readJsonRecord(config.claudeSettingsPath)['enabledPlugins']) ?? {})
    .filter(([, isEnabled]) => isEnabled === true)
    .map(([pluginId]) => pluginId)
  return enabledPlugins
    .filter((pluginId) => {
      const name = pluginNameOf(pluginId)
      return !allSessions.some((session) =>
        session.toolCalls.some((call) => (call.name === 'Skill' && call.target.startsWith(`${name}:`)) || call.name.startsWith(`mcp__plugin_${name}_`)),
      )
    })
    .map((pluginId) => {
      const name = pluginNameOf(pluginId)
      const belongsToPlugin = (itemName: string) => itemName.startsWith(`${name}:`) || itemName.startsWith(`mcp__plugin_${name}_`)
      let monthlyCostUSD = 0
      for (const metric of recentMetrics) {
        const chars = [...metric.session.listedSkills, ...metric.session.deferredTools, ...metric.session.toolDefinitions]
          .filter((item) => belongsToPlugin(item.name))
          .reduce((total, item) => total + item.chars, 0)
        monthlyCostUSD += fixedContextCostUSD(chars * metric.tokensPerSectionChar, metric, rates)
      }
      return {
        key: `disable-plugin:${pluginId}`,
        findingId: 'unused-skills',
        title: `Désactiver le plugin « ${name} »`,
        rationale: 'Aucun de ses skills ni de ses outils MCP n’a été appelé sur tout l’historique.',
        changes: [{ target: '~/.claude/settings.json → enabledPlugins', description: `passe « ${pluginId} » à false (le plugin reste installé)` }],
        estimatedMonthlySavingUSD: monthlyCostUSD,
        project: null,
        caveat: 'Désactivé, pas désinstallé : Annuler le réactive.',
        payload: { kind: 'disable-plugin', pluginId },
      }
    })
}
