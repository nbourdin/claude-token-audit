import type { SessionMetrics } from '../../analysis/session-metrics.ts'
import { mcpServerOf } from '../../analysis/tool-server-name.ts'
import type { ListedItem } from '../../model/session-summary.ts'
import type { ContextFootprint } from '../action-types.ts'

function totalChars(items: ListedItem[], belongs: (name: string) => boolean): number {
  return items.filter((item) => belongs(item.name)).reduce((total, item) => total + item.chars, 0)
}

function footprintChars({ session }: SessionMetrics, footprint: ContextFootprint): number {
  switch (footprint.kind) {
    case 'mcp-server':
      return totalChars([...session.toolDefinitions, ...session.deferredTools], (name) => mcpServerOf(name) === footprint.serverName)
    case 'plugin':
      return totalChars(
        [...session.listedSkills, ...session.toolDefinitions, ...session.deferredTools],
        (name) => name.startsWith(`${footprint.pluginName}:`) || name.startsWith(`mcp__plugin_${footprint.pluginName}_`),
      )
    case 'skills': {
      const skillNames = new Set(footprint.skillNames)
      return totalChars(session.listedSkills, (name) => skillNames.has(name))
    }
  }
}

export function footprintTokens(metric: SessionMetrics, footprint: ContextFootprint): number {
  return footprintChars(metric, footprint) * metric.tokensPerSectionChar
}
