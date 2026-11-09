import type { ActionHandler, ActionKind } from './action-types.ts'
import { agentModelHandler } from './handlers/agent-model-handler.ts'
import { archiveSkillsHandler } from './handlers/archive-skills-handler.ts'
import { contextGuardHookHandler } from './handlers/context-guard-hook-handler.ts'
import { disableMcpServerHandler } from './handlers/disable-mcp-server-handler.ts'
import { disablePluginHandler } from './handlers/disable-plugin-handler.ts'
import { manualActionHandler } from './handlers/manual-action-handler.ts'

export const actionHandlers: Record<ActionKind, ActionHandler> = {
  'archive-skills': archiveSkillsHandler,
  'disable-mcp-server': disableMcpServerHandler,
  'disable-plugin': disablePluginHandler,
  'agent-model': agentModelHandler,
  'context-guard-hook': contextGuardHookHandler,
  manual: manualActionHandler,
}
