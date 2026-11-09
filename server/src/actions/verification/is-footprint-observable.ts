import type { SessionMetrics } from '../../analysis/session-metrics.ts'
import type { ContextFootprint } from '../action-types.ts'

export function isFootprintObservable({ session }: SessionMetrics, footprint: ContextFootprint): boolean {
  switch (footprint.kind) {
    case 'mcp-server':
    case 'plugin':
      return session.toolDefinitions.length + session.deferredTools.length > 0
    case 'skills':
      return session.listedSkills.length > 0
  }
}
