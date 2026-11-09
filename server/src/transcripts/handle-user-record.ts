import { MAIN_THREAD_ID } from '../model/session-summary.ts'
import type { JsonRecord } from './json-access.ts'
import { asArray, asRecord, asString, readPath } from './json-access.ts'
import { measureToolResultChars } from './measure-tool-result.ts'
import type { SessionBuilder } from './session-builder.ts'

function recordToolResults(builder: SessionBuilder, content: unknown[]): boolean {
  let hasToolResult = false
  for (const block of content) {
    const record = asRecord(block)
    if (!record || record['type'] !== 'tool_result') continue
    hasToolResult = true
    const toolCall = builder.toolCallsById.get(asString(record['tool_use_id']))
    if (!toolCall) continue
    toolCall.resultChars = measureToolResultChars(record['content'])
    toolCall.isError = record['is_error'] === true
  }
  return hasToolResult
}

function humanPromptText(content: unknown): string {
  if (typeof content === 'string') return content
  return asArray(content)
    .map((block) => asString(readPath(block, 'text')))
    .join('\n')
}

function isHumanPrompt(record: JsonRecord, text: string): boolean {
  if (record['isMeta'] === true || record['isCompactSummary'] === true) return false
  const originKind = asString(readPath(record, 'origin', 'kind'))
  if (originKind) return originKind === 'human'
  return text.length > 0 && !text.startsWith('<')
}

export function handleUserRecord(builder: SessionBuilder, record: JsonRecord, threadId: string, at: number): void {
  const content = readPath(record, 'message', 'content')
  if (Array.isArray(content) && recordToolResults(builder, content)) return
  if (threadId !== MAIN_THREAD_ID) return
  const text = humanPromptText(content)
  if (isHumanPrompt(record, text)) builder.userPrompts.push({ at, chars: text.length })
}
