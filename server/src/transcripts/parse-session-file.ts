import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import type { SessionSummary } from '../model/session-summary.ts'
import { MAIN_THREAD_ID } from '../model/session-summary.ts'
import { finalizeSession } from './finalize-session.ts'
import { ingestTranscriptRecord } from './ingest-transcript-record.ts'
import { asRecord, asString } from './json-access.ts'
import { readJsonlRecords } from './read-jsonl-records.ts'
import type { SessionBuilder } from './session-builder.ts'
import { createSessionBuilder } from './session-builder.ts'

const SUBAGENT_FILE_PATTERN = /^agent-(.+)\.jsonl$/

function readSubagentMeta(metaPath: string): { agentType: string; description: string } {
  if (!existsSync(metaPath)) return { agentType: 'unknown', description: '' }
  try {
    const meta = asRecord(JSON.parse(readFileSync(metaPath, 'utf8')))
    return { agentType: asString(meta?.['agentType'], 'unknown'), description: asString(meta?.['description']) }
  } catch {
    return { agentType: 'unknown', description: '' }
  }
}

async function ingestSubagents(builder: SessionBuilder, sessionDirectory: string): Promise<void> {
  const subagentsDirectory = join(sessionDirectory, 'subagents')
  if (!existsSync(subagentsDirectory)) return
  for (const fileName of readdirSync(subagentsDirectory)) {
    const match = fileName.match(SUBAGENT_FILE_PATTERN)
    if (!match) continue
    const threadId = `agent-${match[1]}`
    builder.subagents.push({ threadId, ...readSubagentMeta(join(subagentsDirectory, `${threadId}.meta.json`)) })
    for await (const record of readJsonlRecords(join(subagentsDirectory, fileName))) {
      ingestTranscriptRecord(builder, record, threadId)
    }
  }
}

export async function parseSessionFile(filePath: string): Promise<SessionSummary | null> {
  const sessionId = basename(filePath, '.jsonl')
  const builder = createSessionBuilder(filePath, sessionId)
  for await (const record of readJsonlRecords(filePath)) {
    const threadId = record['isSidechain'] === true ? `agent-${asString(record['agentId'], 'inline')}` : MAIN_THREAD_ID
    ingestTranscriptRecord(builder, record, threadId)
  }
  await ingestSubagents(builder, filePath.slice(0, -'.jsonl'.length))
  return finalizeSession(builder)
}
