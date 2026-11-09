const MCP_TOOL_PATTERN = /^mcp__(.+?)__(.+)$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-/

export function mcpServerOf(toolName: string): string | null {
  return toolName.match(MCP_TOOL_PATTERN)?.[1] ?? null
}

export function mcpToolSuffix(toolName: string): string {
  return toolName.match(MCP_TOOL_PATTERN)?.[2] ?? toolName
}

export function describeServer(server: string, sampleToolNames: string[]): string {
  if (!UUID_PATTERN.test(server)) return server
  const hint = sampleToolNames.map(mcpToolSuffix).find((name) => name.length > 0) ?? ''
  return `connector ${server.slice(0, 8)} (${hint}…)`
}
