import type {
  ApiRequest,
  ContextSection,
  ListedItem,
  ReportedModelUsage,
  ShapeChange,
  Subagent,
  ToolCall,
  ToolDefinition,
  UserPrompt,
} from '../model/session-summary.ts'

export type PendingToolCall = Omit<ToolCall, 'carriedRequests'>

export type SessionBuilder = {
  sessionId: string
  sourceFile: string
  cwd: string
  gitBranch: string
  entrypoint: string
  cliVersion: string
  title: string
  fallbackTitle: string
  startedAt: number
  endedAt: number
  requestsByMessageId: Map<string, ApiRequest>
  toolCallsById: Map<string, PendingToolCall>
  subagents: Subagent[]
  contextSections: ContextSection[]
  toolDefinitions: ToolDefinition[]
  listedSkills: ListedItem[]
  deferredTools: ListedItem[]
  hasShape: boolean
  lastShapeHash: string
  shapeChanges: ShapeChange[]
  compactionsAt: number[]
  apiErrors: number
  userPrompts: UserPrompt[]
  reportedModelUsage: ReportedModelUsage[]
  hasSeenMainRequest: boolean
}

export function createSessionBuilder(sourceFile: string, sessionId: string): SessionBuilder {
  return {
    sessionId,
    sourceFile,
    cwd: '',
    gitBranch: '',
    entrypoint: '',
    cliVersion: '',
    title: '',
    fallbackTitle: '',
    startedAt: Number.POSITIVE_INFINITY,
    endedAt: 0,
    requestsByMessageId: new Map(),
    toolCallsById: new Map(),
    subagents: [],
    contextSections: [],
    toolDefinitions: [],
    listedSkills: [],
    deferredTools: [],
    hasShape: false,
    lastShapeHash: '',
    shapeChanges: [],
    compactionsAt: [],
    apiErrors: 0,
    userPrompts: [],
    reportedModelUsage: [],
    hasSeenMainRequest: false,
  }
}
