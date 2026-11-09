import { basename } from 'node:path'
import type { AppliedAction, VerificationTarget } from '../action-types.ts'

export function legacyVerificationTarget({ undo }: AppliedAction): VerificationTarget {
  switch (undo.kind) {
    case 'mcp-server-config':
      return { kind: 'footprint', footprint: { kind: 'mcp-server', serverName: undo.serverName }, label: `outils du serveur « ${undo.serverName} »` }
    case 'plugin-enabled': {
      const pluginName = undo.pluginId.split('@')[0] ?? undo.pluginId
      return { kind: 'footprint', footprint: { kind: 'plugin', pluginName }, label: `skills et outils du plugin « ${pluginName} »` }
    }
    case 'moves': {
      const skillNames = undo.moves.map((move) => basename(move.from))
      return { kind: 'footprint', footprint: { kind: 'skills', skillNames }, label: `${skillNames.length} skill${skillNames.length > 1 ? 's' : ''} archivé${skillNames.length > 1 ? 's' : ''}` }
    }
    case 'agent-model':
      return { kind: 'agent-model', agentType: basename(undo.agentFilePath, '.md'), model: 'sonnet' }
    case 'hook-entry':
      return { kind: 'context-guard-hook' }
    case 'none':
      return { kind: 'none' }
  }
}
