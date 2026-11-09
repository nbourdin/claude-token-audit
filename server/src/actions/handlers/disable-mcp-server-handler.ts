import { config } from '../../config.ts'
import { asRecord } from '../../transcripts/json-access.ts'
import type { ActionHandler } from '../action-types.ts'
import { updateJsonRecord } from '../json-file.ts'

export const disableMcpServerHandler: ActionHandler = {
  apply(payload) {
    if (payload.kind !== 'disable-mcp-server') throw new Error('unexpected payload')
    let serverConfig: unknown = null
    updateJsonRecord(config.claudeJsonPath, (claudeJson) => {
      const servers = asRecord(claudeJson['mcpServers'])
      if (!servers || !(payload.serverName in servers)) throw new Error(`MCP server "${payload.serverName}" is not configured in ${config.claudeJsonPath}`)
      serverConfig = servers[payload.serverName]
      delete servers[payload.serverName]
    })
    return { kind: 'mcp-server-config', serverName: payload.serverName, serverConfig }
  },
  undo(record) {
    if (record.kind !== 'mcp-server-config') throw new Error('unexpected undo record')
    updateJsonRecord(config.claudeJsonPath, (claudeJson) => {
      const servers = asRecord(claudeJson['mcpServers']) ?? {}
      if (!(record.serverName in servers)) servers[record.serverName] = record.serverConfig
      claudeJson['mcpServers'] = servers
    })
  },
}
