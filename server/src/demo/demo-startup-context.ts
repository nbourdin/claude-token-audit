import type { DemoProject } from './demo-scenario.ts'
import { BUILT_IN_TOOLS, DEMO_HOME, DEMO_PLUGIN, LEGACY_SERVER, MCP_SERVERS, NOTION_CONNECTOR_ID, NOTION_TOOLS, USER_SKILLS } from './demo-scenario.ts'
import type { DemoRecord } from './demo-thread.ts'

const CHARS_PER_TOKEN = 3.5
const FILLER_LINES = [
  '- Keep functions small and named after what they do.',
  '- Run the type checker and the affected tests before saying a task is done.',
  '- Amounts are integers in cents; format them only at the edge.',
  '- Never log personal data; use the structured logger with a request id.',
  '- Prefer composition over flags; one component per file.',
  '- Database access goes through the repository of the aggregate.',
]

export function fillerText(chars: number): string {
  let text = ''
  for (let index = 0; text.length < chars; index += 1) text += `${FILLER_LINES[index % FILLER_LINES.length]}\n`
  return text.slice(0, chars)
}

function toolDefinition(name: string, chars: number): DemoRecord {
  return { name, description: fillerText(Math.max(40, chars - 120)), input_schema: { type: 'object', properties: {} } }
}

function mcpToolName(server: string, tool: string): string {
  return `mcp__${server}__${tool}`
}

export type StartupContext = {
  records: DemoRecord[]
  baselineTokens: number
}

export function buildStartupContext(project: DemoProject, options: { includesLegacyServer: boolean }): StartupContext {
  const eagerServers = MCP_SERVERS.filter((server) => server.name !== 'browser-devtools')
  const tools = [
    ...BUILT_IN_TOOLS.map((tool) => toolDefinition(tool.name, tool.chars)),
    ...eagerServers.flatMap((server) => server.toolNames.map((tool) => toolDefinition(mcpToolName(server.name, tool), server.toolChars))),
    ...(options.includesLegacyServer ? LEGACY_SERVER.toolNames.map((tool) => toolDefinition(mcpToolName(LEGACY_SERVER.name, tool), LEGACY_SERVER.toolChars)) : []),
  ]
  const deferredToolNames = [
    ...MCP_SERVERS.filter((server) => server.name === 'browser-devtools').flatMap((server) => server.toolNames.map((tool) => mcpToolName(server.name, tool))),
    ...NOTION_TOOLS.map((tool) => mcpToolName(NOTION_CONNECTOR_ID, tool)),
  ]
  const mcpInstructions = `# MCP Server Instructions\n\n## jira\n${fillerText(2_400)}\n## postgres-explorer\n${fillerText(1_600)}\n${options.includesLegacyServer ? `## legacy-search\n${fillerText(3_200)}\n` : ''}`
  const systemBlocks = [{ text: fillerText(2_800) }, { text: fillerText(36_000) }, { text: mcpInstructions }]
  const skillLines = [
    ...USER_SKILLS.map((skill) => `- ${skill.name}: ${fillerText(380).replace(/\n/g, ' ')}`),
    ...DEMO_PLUGIN.skills.map((skill) => `- ${DEMO_PLUGIN.name}:${skill}: ${fillerText(420).replace(/\n/g, ' ')}`),
  ]
  const environment = `# Environment\n${fillerText(3_000)}\nThe following skills are available for use with the Skill tool:\n\n${skillLines.join('\n')}\n\nThe following deferred tools are now available via ToolSearch:\n${deferredToolNames.join('\n')}\n\n`
  const memorySlug = `-Users-demo-${project.cwd.slice(DEMO_HOME.length + 1).replace(/\//g, '-')}`
  const reminder = `<system-reminder>\nContents of ${project.cwd}/CLAUDE.md (project instructions, checked into the codebase):\n\n${fillerText(project.instructionsChars)}\nContents of ${DEMO_HOME}/.claude/projects/${memorySlug}/memory/MEMORY.md (user's auto-memory, persists across conversations):\n\n${fillerText(project.memoryChars)}\n# currentDate\nToday's date is in the demo.\n</system-reminder>`
  const totalChars =
    systemBlocks.reduce((total, block) => total + block.text.length, 0) + tools.reduce((total, tool) => total + JSON.stringify(tool).length, 0) + environment.length + reminder.length
  return {
    records: [
      { type: 'api-request-shape', shape: { system: systemBlocks, tools: [...tools, ...deferredToolNames.map((name) => ({ name, defer_loading: true }))] } },
      { type: 'api-request-blob', message: { role: 'system', content: [{ type: 'text', text: environment }] } },
      { type: 'api-request-blob', message: { role: 'user', content: [{ type: 'text', text: reminder }] } },
    ],
    baselineTokens: Math.round(totalChars / CHARS_PER_TOKEN),
  }
}
