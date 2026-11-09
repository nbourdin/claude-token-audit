import { mcpServerOf, mcpToolSuffix } from './tool-server-name.ts'

const LEADING_CD_PATTERN = /^(?:cd\s+\S+\s*(?:&&|;)\s*)+/
const ENV_ASSIGNMENT_PATTERN = /^(?:[A-Z_][A-Z0-9_]*=\S*\s+)+/
const COMMAND_WORDS = 2

function bashCommandFamily(command: string): string {
  const cleaned = command.replace(LEADING_CD_PATTERN, '').replace(ENV_ASSIGNMENT_PATTERN, '').trim()
  return cleaned.split(/\s+/).slice(0, COMMAND_WORDS).join(' ')
}

export function toolCallGroup(name: string, target: string): string {
  if (name === 'Bash') return `Bash: ${bashCommandFamily(target)}`
  const server = mcpServerOf(name)
  if (server) return `MCP ${mcpToolSuffix(name)}`
  return name
}
