import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SessionSummary } from '../model/session-summary.ts'

export type CachedSession = {
  fingerprint: string
  summary: SessionSummary | null
}

function cachePath(cacheDirectory: string, sessionId: string): string {
  return join(cacheDirectory, `${sessionId}.json`)
}

export function readCachedSession(cacheDirectory: string, sessionId: string): CachedSession | null {
  const path = cachePath(cacheDirectory, sessionId)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

export function writeCachedSession(cacheDirectory: string, sessionId: string, cached: CachedSession): void {
  mkdirSync(cacheDirectory, { recursive: true })
  writeFileSync(cachePath(cacheDirectory, sessionId), JSON.stringify(cached))
}

export function removeStaleCacheEntries(cacheDirectory: string, liveSessionIds: Set<string>): void {
  if (!existsSync(cacheDirectory)) return
  for (const fileName of readdirSync(cacheDirectory)) {
    if (!liveSessionIds.has(fileName.replace(/\.json$/, ''))) rmSync(join(cacheDirectory, fileName))
  }
}
