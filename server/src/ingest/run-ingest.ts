import { config } from '../config.ts'
import type { SessionSummary } from '../model/session-summary.ts'
import { parseSessionFile } from '../transcripts/parse-session-file.ts'
import type { TranscriptFile } from './discover-transcript-files.ts'
import { discoverTranscriptFiles } from './discover-transcript-files.ts'
import { readCachedSession, removeStaleCacheEntries, writeCachedSession } from './session-cache.ts'

const PARALLEL_PARSES = 6

export type IngestResult = {
  sessions: SessionSummary[]
  parsedFiles: number
  cachedFiles: number
  durationMs: number
}

async function loadSession(file: TranscriptFile): Promise<{ summary: SessionSummary | null; fromCache: boolean }> {
  const cached = readCachedSession(config.sessionCacheDirectory, file.sessionId)
  if (cached?.fingerprint === file.fingerprint) return { summary: cached.summary, fromCache: true }
  const summary = await parseSessionFile(file.path)
  writeCachedSession(config.sessionCacheDirectory, file.sessionId, { fingerprint: file.fingerprint, summary })
  return { summary, fromCache: false }
}

export async function runIngest(onProgress?: (done: number, total: number) => void): Promise<IngestResult> {
  const startedAt = Date.now()
  const files = discoverTranscriptFiles(config.transcriptsDirectory)
  const sessions: SessionSummary[] = []
  let parsedFiles = 0
  let cachedFiles = 0
  let nextIndex = 0
  let done = 0
  async function worker(): Promise<void> {
    while (nextIndex < files.length) {
      const file = files[nextIndex]!
      nextIndex += 1
      const { summary, fromCache } = await loadSession(file)
      if (fromCache) cachedFiles += 1
      else parsedFiles += 1
      if (summary) sessions.push(summary)
      done += 1
      onProgress?.(done, files.length)
    }
  }
  await Promise.all(Array.from({ length: PARALLEL_PARSES }, worker))
  removeStaleCacheEntries(config.sessionCacheDirectory, new Set(files.map((file) => file.sessionId)))
  sessions.sort((left, right) => right.startedAt - left.startedAt)
  return { sessions, parsedFiles, cachedFiles, durationMs: Date.now() - startedAt }
}
