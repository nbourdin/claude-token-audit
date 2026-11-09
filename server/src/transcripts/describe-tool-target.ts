import { asRecord, asString } from './json-access.ts'

const TARGET_FIELDS = ['file_path', 'notebook_path', 'path', 'command', 'pattern', 'url', 'query', 'skill', 'description', 'prompt', 'action']
const MAX_TARGET_LENGTH = 160

export function describeToolTarget(input: unknown): string {
  const record = asRecord(input)
  if (!record) return ''
  for (const field of TARGET_FIELDS) {
    const value = asString(record[field]).trim()
    if (value) return value.split('\n')[0]!.slice(0, MAX_TARGET_LENGTH)
  }
  return ''
}
