import type { JsonRecord } from './json-access.ts'
import { asNumber, asRecord, asString } from './json-access.ts'
import { parseReportedModelUsage } from './parse-token-usage.ts'
import type { SessionBuilder } from './session-builder.ts'

export function handleTitleRecord(builder: SessionBuilder, record: JsonRecord): void {
  const type = record['type']
  if (type === 'custom-title') builder.title = asString(record['customTitle']) || builder.title
  if (type === 'agent-name' && !builder.title) builder.title = asString(record['agentName'])
  if (type === 'summary' && !builder.fallbackTitle) builder.fallbackTitle = asString(record['summary'])
  if (type === 'last-prompt' && !builder.fallbackTitle) builder.fallbackTitle = asString(record['lastPrompt']).slice(0, 90)
}

export function handleCostStateRecord(builder: SessionBuilder, record: JsonRecord): void {
  const modelUsage = asRecord(record['modelUsage'])
  if (!modelUsage) return
  builder.reportedModelUsage = Object.entries(modelUsage).map(([model, usage]) => ({
    model,
    usage: parseReportedModelUsage(usage),
    costUSD: asNumber(asRecord(usage)?.['costUSD']),
  }))
}

export function handleSystemRecord(builder: SessionBuilder, record: JsonRecord, at: number): void {
  const subtype = record['subtype']
  if (subtype === 'compact_boundary') builder.compactionsAt.push(at)
  if (subtype === 'api_error') builder.apiErrors += 1
}

export function captureSessionMetadata(builder: SessionBuilder, record: JsonRecord): void {
  if (!builder.cwd) builder.cwd = asString(record['cwd'])
  if (!builder.gitBranch) builder.gitBranch = asString(record['gitBranch'])
  if (!builder.entrypoint) builder.entrypoint = asString(record['entrypoint'])
  const version = asString(record['version'])
  if (version) builder.cliVersion = version
}
