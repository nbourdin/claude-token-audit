export type ActionPayload =
  | { kind: 'archive-skills'; skillNames: string[] }
  | { kind: 'disable-mcp-server'; serverName: string }
  | { kind: 'disable-plugin'; pluginId: string }
  | { kind: 'agent-model'; agentFilePath: string; agentType: string; model: string }
  | { kind: 'context-guard-hook'; contextThresholdTokens: number; idleMinutes: number; inputPricePerMillion: number }
  | { kind: 'manual'; instructions: string; prompt: string | null }

export type ActionKind = ActionPayload['kind']

export type ActionChange = {
  target: string
  description: string
}

export type ContextFootprint =
  | { kind: 'mcp-server'; serverName: string }
  | { kind: 'plugin'; pluginName: string }
  | { kind: 'skills'; skillNames: string[] }

export type VerificationTarget =
  | { kind: 'footprint'; footprint: ContextFootprint; label: string }
  | { kind: 'agent-model'; agentType: string; model: string }
  | { kind: 'context-file'; path: string; thresholdTokens: number }
  | { kind: 'context-guard-hook' }
  | { kind: 'none' }

export type ProposedAction = {
  key: string
  findingId: string | null
  title: string
  rationale: string
  changes: ActionChange[]
  estimatedMonthlySavingUSD: number
  project: string | null
  caveat: string | null
  payload: ActionPayload
  verification: VerificationTarget
}

export type UndoRecord =
  | { kind: 'moves'; moves: Array<{ from: string; to: string }> }
  | { kind: 'mcp-server-config'; serverName: string; serverConfig: unknown }
  | { kind: 'plugin-enabled'; pluginId: string; previousValue: unknown }
  | { kind: 'agent-model'; agentFilePath: string; previousModel: string | null }
  | { kind: 'hook-entry'; scriptPath: string }
  | { kind: 'none' }

export type AppliedAction = {
  id: string
  key: string
  kind: ActionKind
  title: string
  project: string | null
  estimatedMonthlySavingUSD: number
  appliedAt: number
  markerId: string | null
  undo: UndoRecord
  undoneAt: number | null
  verification?: VerificationTarget
}

export type VerificationStatus = 'waiting' | 'effective' | 'partial' | 'ineffective' | 'in-place' | 'missing' | 'not-verifiable' | 'undone'

export type ActionVerification = {
  status: VerificationStatus
  detail: string
  observed: number
  stillAffected: number
  observedUnit: 'session' | 'run' | 'load'
  lastAffectedAt: number | null
  measuredMonthlySavingUSD: number | null
  measuredOverDays: number
}

export type AppliedActionView = Omit<AppliedAction, 'undo' | 'verification'> & {
  verification: ActionVerification
}

export type ActionHandler = {
  apply: (payload: ActionPayload) => UndoRecord
  undo: (record: UndoRecord) => void
}
