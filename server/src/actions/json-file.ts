import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import type { JsonRecord } from '../transcripts/json-access.ts'
import { asRecord } from '../transcripts/json-access.ts'

export function readJsonRecord(path: string): JsonRecord {
  if (!existsSync(path)) return {}
  const record = asRecord(JSON.parse(readFileSync(path, 'utf8')))
  if (!record) throw new Error(`${path} is not a JSON object`)
  return record
}

export function writeJsonAtomically(path: string, value: unknown): void {
  const temporaryPath = `${path}.token-audit-${process.pid}.tmp`
  const mode = existsSync(path) ? statSync(path).mode & 0o777 : 0o600
  writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { mode })
  renameSync(temporaryPath, path)
}

export function updateJsonRecord(path: string, update: (record: JsonRecord) => void): void {
  const record = readJsonRecord(path)
  update(record)
  writeJsonAtomically(path, record)
}
