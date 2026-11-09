export type TokenUsage = {
  input: number
  cacheWrite5m: number
  cacheWrite1h: number
  cacheRead: number
  output: number
  thinking: number
}

export type ApiRequest = {
  at: number
  model: string
  usage: TokenUsage
  threadId: string
  contextTokens: number
}

export type ToolCall = {
  id: string
  name: string
  target: string
  threadId: string
  at: number
  resultChars: number
  isError: boolean
  carriedRequests: number
}

export type ContextSectionKind =
  | 'core-prompt'
  | 'tool-definitions'
  | 'project-instructions'
  | 'memory'
  | 'skills'
  | 'mcp-instructions'
  | 'deferred-tools'
  | 'session-context'

export type ContextSection = {
  label: string
  kind: ContextSectionKind
  chars: number
  filePath?: string
}

export type InjectedFile = {
  path: string
  chars: number
  at: number
  threadId: string
  carriedRequests: number
}

export type ListedItem = {
  name: string
  chars: number
}

export type ToolDefinition = {
  name: string
  chars: number
}

export type Subagent = {
  threadId: string
  agentType: string
  description: string
}

export type ShapeChange = {
  at: number
}

export type ReportedModelUsage = {
  model: string
  usage: TokenUsage
  costUSD: number
}

export type UserPrompt = {
  at: number
  chars: number
}

export type SessionSummary = {
  sessionId: string
  sourceFile: string
  projectName: string
  cwd: string
  worktree: string | null
  title: string
  gitBranch: string
  entrypoint: string
  cliVersion: string
  startedAt: number
  endedAt: number
  requests: ApiRequest[]
  toolCalls: ToolCall[]
  injectedFiles: InjectedFile[]
  subagents: Subagent[]
  contextSections: ContextSection[]
  toolDefinitions: ToolDefinition[]
  listedSkills: ListedItem[]
  deferredTools: ListedItem[]
  shapeChanges: ShapeChange[]
  compactionsAt: number[]
  apiErrors: number
  userPrompts: UserPrompt[]
  reportedModelUsage: ReportedModelUsage[]
}

export const MAIN_THREAD_ID = 'main'
