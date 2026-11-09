export type JsonRecord = Record<string, unknown>

export function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function readPath(value: unknown, ...keys: string[]): unknown {
  let current: unknown = value
  for (const key of keys) {
    const record = asRecord(current)
    if (!record) return undefined
    current = record[key]
  }
  return current
}
