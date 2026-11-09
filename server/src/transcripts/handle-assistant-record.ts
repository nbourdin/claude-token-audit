import { MAIN_THREAD_ID } from '../model/session-summary.ts'
import { describeToolTarget } from './describe-tool-target.ts'
import type { JsonRecord } from './json-access.ts'
import { asArray, asRecord, asString, readPath } from './json-access.ts'
import { contextTokensOf, parseTokenUsage } from './parse-token-usage.ts'
import type { SessionBuilder } from './session-builder.ts'

const SYNTHETIC_MODEL = '<synthetic>'

function registerToolUses(builder: SessionBuilder, content: unknown, threadId: string, at: number): void {
  for (const block of asArray(content)) {
    const record = asRecord(block)
    if (!record || record['type'] !== 'tool_use') continue
    const id = asString(record['id'])
    if (!id || builder.toolCallsById.has(id)) continue
    builder.toolCallsById.set(id, {
      id,
      name: asString(record['name'], 'unknown'),
      target: describeToolTarget(record['input']),
      threadId,
      at,
      resultChars: 0,
      isError: false,
    })
  }
}

export function handleAssistantRecord(builder: SessionBuilder, record: JsonRecord, threadId: string, at: number): void {
  const message = asRecord(record['message'])
  if (!message) return
  const model = asString(message['model'])
  const messageId = asString(message['id']) || asString(record['requestId'])
  registerToolUses(builder, message['content'], threadId, at)
  if (!messageId || model === SYNTHETIC_MODEL || !readPath(message, 'usage')) return
  const usage = parseTokenUsage(message['usage'])
  const existing = builder.requestsByMessageId.get(messageId)
  builder.requestsByMessageId.set(messageId, {
    at: existing?.at ?? at,
    model,
    usage,
    threadId,
    contextTokens: contextTokensOf(usage),
  })
  if (threadId === MAIN_THREAD_ID) builder.hasSeenMainRequest = true
}
