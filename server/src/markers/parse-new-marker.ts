import { asRecord, asString } from '../transcripts/json-access.ts'
import type { NewChangeMarker } from './change-marker.ts'

const MAX_LABEL_LENGTH = 200

export function parseNewMarker(body: unknown): NewChangeMarker | string {
  const record = asRecord(body)
  if (!record) return 'body must be a JSON object'
  const label = asString(record['label']).trim().slice(0, MAX_LABEL_LENGTH)
  if (!label) return 'label is required'
  const at = typeof record['at'] === 'number' ? record['at'] : Date.parse(asString(record['at']))
  if (!Number.isFinite(at) || at <= 0) return 'at must be a timestamp or an ISO date'
  const project = asString(record['project']).trim()
  return { at, label, project: project || null }
}
