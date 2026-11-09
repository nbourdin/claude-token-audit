import type { JsonRecord } from './json-access.ts'
import { asRecord, asString } from './json-access.ts'
import type { SessionBuilder } from './session-builder.ts'

export function handleAttachmentRecord(builder: SessionBuilder, record: JsonRecord, threadId: string, at: number): void {
  const attachment = asRecord(record['attachment'])
  if (attachment?.['type'] !== 'nested_memory') return
  const path = asString(attachment['path'])
  const content = asString(asRecord(attachment['content'])?.['content'])
  if (path && content) builder.injectedFiles.push({ path, chars: content.length, at, threadId })
}
