import type { CostBreakdown } from '../cost/request-cost.ts'
import type { ChangeMarker } from '../markers/change-marker.ts'
import type { ContextSectionKind } from '../model/session-summary.ts'
import type { ContextFileCategory } from './context-file-category.ts'

export type ReportFilter = {
  sinceDays: number | null
  project: string | null
}

export type FindingSeverity = 'high' | 'medium' | 'low'

export type FindingEvidence = {
  label: string
  value: string
  detail?: string
  sessionId?: string
}

export type Finding = {
  id: string
  title: string
  severity: FindingSeverity
  impactUSD: number
  impactTokens: number
  summary: string
  recommendations: string[]
  evidence: FindingEvidence[]
}

export type SessionRow = {
  sessionId: string
  title: string
  projectName: string
  worktree: string | null
  gitBranch: string
  startedAt: number
  durationMinutes: number
  costUSD: number
  requests: number
  userPrompts: number
  toolCalls: number
  peakContextTokens: number
  averageContextTokens: number
  baselineTokens: number
  cacheRebuildCostUSD: number
  subagentCostUSD: number
  mainModel: string
}

export type DailyCost = {
  day: string
  costByModel: Record<string, number>
  totalUSD: number
}

export type ProjectCost = {
  projectName: string
  costUSD: number
  sessions: number
}

export type ToolAggregate = {
  name: string
  server: string | null
  calls: number
  errors: number
  resultTokens: number
  carriedTokens: number
  costUSD: number
}

export type BaselineSectionAggregate = {
  label: string
  kind: ContextSectionKind
  averageTokens: number
  sessions: number
  costUSD: number
}

export type ContextFileOrigin = 'startup' | 'nested' | 'read'

export type ContextFileAggregate = {
  path: string
  category: ContextFileCategory
  origins: ContextFileOrigin[]
  sessions: number
  loads: number
  averageTokens: number
  maxTokens: number
  costUSD: number
  thresholdTokens: number
  isOversized: boolean
}

export type ModelSummary = {
  model: string
  costUSD: number
  requests: number
  inputPricePerMillion: number
  priceSource: 'reported' | 'family-default'
}

export type ReportTotals = {
  costUSD: number
  sessions: number
  requests: number
  userPrompts: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  uncachedInputTokens: number
  cacheHitRatio: number
  averageBaselineTokens: number
  medianPeakContextTokens: number
  costPerUserPromptUSD: number
}

export type AuditReport = {
  generatedAt: number
  filter: ReportFilter
  availableProjects: string[]
  totals: ReportTotals
  costComposition: CostBreakdown
  dailyCosts: DailyCost[]
  projectCosts: ProjectCost[]
  models: ModelSummary[]
  baselineSections: BaselineSectionAggregate[]
  contextFiles: ContextFileAggregate[]
  tools: ToolAggregate[]
  findings: Finding[]
  sessions: SessionRow[]
}

export type AuditReportResponse = AuditReport & { lastIngestAt: number; markers: ChangeMarker[] }
