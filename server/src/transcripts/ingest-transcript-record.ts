import { MAIN_THREAD_ID } from '../model/session-summary.ts'
import { handleAssistantRecord } from './handle-assistant-record.ts'
import { captureSessionMetadata, handleCostStateRecord, handleSystemRecord, handleTitleRecord } from './handle-metadata-record.ts'
import { handleRequestBlobRecord, handleRequestRecord, handleRequestShapeRecord } from './handle-request-records.ts'
import { handleUserRecord } from './handle-user-record.ts'
import type { JsonRecord } from './json-access.ts'
import { asString } from './json-access.ts'
import type { SessionBuilder } from './session-builder.ts'

function timestampOf(record: JsonRecord): number {
  const parsed = Date.parse(asString(record['timestamp']))
  return Number.isNaN(parsed) ? 0 : parsed
}

export function ingestTranscriptRecord(builder: SessionBuilder, record: JsonRecord, threadId: string): void {
  const at = timestampOf(record)
  if (at > 0 && record['type'] !== 'queue-operation') {
    builder.startedAt = Math.min(builder.startedAt, at)
    builder.endedAt = Math.max(builder.endedAt, at)
  }
  const isMainThread = threadId === MAIN_THREAD_ID
  if (isMainThread) captureSessionMetadata(builder, record)
  switch (record['type']) {
    case 'assistant':
      return handleAssistantRecord(builder, record, threadId, at)
    case 'user':
      return handleUserRecord(builder, record, threadId, at)
    case 'system':
      if (isMainThread) handleSystemRecord(builder, record, at)
      return
    case 'api-request-shape':
      if (isMainThread) handleRequestShapeRecord(builder, record)
      return
    case 'api-request':
      if (isMainThread) handleRequestRecord(builder, record, at)
      return
    case 'api-request-blob':
      if (isMainThread) handleRequestBlobRecord(builder, record)
      return
    case 'cost-state':
      if (isMainThread) handleCostStateRecord(builder, record)
      return
    default:
      if (isMainThread) handleTitleRecord(builder, record)
  }
}
