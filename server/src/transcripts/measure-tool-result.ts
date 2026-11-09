import { asArray, asRecord, asString } from './json-access.ts'

const IMAGE_CHARS_EQUIVALENT = 6000

export function measureToolResultChars(content: unknown): number {
  if (typeof content === 'string') return content.length
  let total = 0
  for (const block of asArray(content)) {
    const record = asRecord(block)
    if (!record) continue
    if (record['type'] === 'image') total += IMAGE_CHARS_EQUIVALENT
    else total += asString(record['text']).length
  }
  return total
}
