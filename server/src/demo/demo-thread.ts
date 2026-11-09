const CHARS_PER_TOKEN = 3.5
const CACHE_LIFETIME_MS = 60 * 60 * 1000
const CLI_VERSION = '2.1.30'

export type DemoRecord = Record<string, unknown>

export type DemoThread = {
  records: DemoRecord[]
  at: number
  model: string
  contextTokens: number
  cachedTokens: number
  lastRequestAt: number
  messageCount: number
  common: DemoRecord
}

export function createDemoThread(options: { at: number; model: string; baselineTokens: number; common: DemoRecord }): DemoThread {
  return { records: [], at: options.at, model: options.model, contextTokens: options.baselineTokens, cachedTokens: 0, lastRequestAt: 0, messageCount: 0, common: options.common }
}

function timestamp(thread: DemoThread): string {
  return new Date(thread.at).toISOString()
}

export function pushRecord(thread: DemoThread, record: DemoRecord): void {
  thread.records.push({ ...thread.common, version: CLI_VERSION, entrypoint: 'cli', timestamp: timestamp(thread), ...record })
}

export function advance(thread: DemoThread, milliseconds: number): void {
  thread.at += Math.round(milliseconds)
}

export function addContextChars(thread: DemoThread, chars: number): void {
  thread.contextTokens += Math.round(chars / CHARS_PER_TOKEN)
}

export function recordAssistantRequest(thread: DemoThread, options: { outputTokens: number; toolUse: { id: string; name: string; input: DemoRecord } | null }): void {
  if (thread.lastRequestAt > 0 && thread.at - thread.lastRequestAt > CACHE_LIFETIME_MS) thread.cachedTokens = 0
  const inputTokens = 3
  const cacheRead = Math.min(thread.cachedTokens, thread.contextTokens - inputTokens)
  const cacheWrite = Math.max(0, thread.contextTokens - inputTokens - cacheRead)
  thread.messageCount += 1
  pushRecord(thread, {
    type: 'assistant',
    message: {
      id: `msg_demo_${thread.common['sessionId']}_${String(thread.common['agentId'] ?? 'main')}_${thread.messageCount}`,
      model: thread.model,
      role: 'assistant',
      content: options.toolUse ? [{ type: 'tool_use', ...options.toolUse }] : [{ type: 'text', text: 'Fait.' }],
      usage: {
        input_tokens: inputTokens,
        cache_creation_input_tokens: cacheWrite,
        cache_creation: { ephemeral_1h_input_tokens: cacheWrite, ephemeral_5m_input_tokens: 0 },
        cache_read_input_tokens: cacheRead,
        output_tokens: options.outputTokens,
      },
    },
  })
  thread.cachedTokens = thread.contextTokens
  thread.contextTokens += options.outputTokens
  thread.lastRequestAt = thread.at
}

export function recordToolResult(thread: DemoThread, options: { toolUseId: string; chars: number; isError: boolean }): void {
  pushRecord(thread, {
    type: 'user',
    message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: options.toolUseId, content: 'x'.repeat(options.chars), is_error: options.isError }] },
  })
  addContextChars(thread, options.chars)
}

export function recordUserPrompt(thread: DemoThread, text: string): void {
  pushRecord(thread, { type: 'user', message: { role: 'user', content: text } })
  addContextChars(thread, text.length + 200)
}

export function recordCompaction(thread: DemoThread, resetToTokens: number): void {
  pushRecord(thread, { type: 'system', subtype: 'compact_boundary', content: 'Conversation compacted' })
  thread.contextTokens = resetToTokens
  thread.cachedTokens = 0
}
