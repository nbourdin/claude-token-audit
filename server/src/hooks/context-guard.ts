import { closeSync, existsSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const TAIL_BYTES = 768 * 1024
const WARNING_STEP_TOKENS = 100_000
const CACHE_READ_MULTIPLIER = 0.1
const CACHE_WRITE_MULTIPLIER = 2

type GuardOptions = {
  thresholdTokens: number
  idleMinutes: number
  inputPricePerMillion: number
  statePath: string
}

type LastRequest = {
  contextTokens: number
  at: number
}

function readOption(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

function readOptions(): GuardOptions {
  return {
    thresholdTokens: Number(readOption('threshold', '150000')),
    idleMinutes: Number(readOption('idle-minutes', '60')),
    inputPricePerMillion: Number(readOption('price', '5')),
    statePath: readOption('state', ''),
  }
}

function readTail(path: string): string {
  const descriptor = openSync(path, 'r')
  try {
    const size = fstatSync(descriptor).size
    const length = Math.min(size, TAIL_BYTES)
    const buffer = Buffer.alloc(length)
    readSync(descriptor, buffer, 0, length, size - length)
    return buffer.toString('utf8')
  } finally {
    closeSync(descriptor)
  }
}

function findLastMainRequest(transcriptPath: string): LastRequest | null {
  const lines = readTail(transcriptPath).split('\n').reverse()
  for (const line of lines) {
    if (!line.includes('"usage"') || !line.includes('"assistant"')) continue
    try {
      const record = JSON.parse(line)
      if (record.type !== 'assistant' || record.isSidechain === true) continue
      const usage = record.message?.usage
      if (!usage) continue
      const contextTokens = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0)
      return { contextTokens, at: Date.parse(record.timestamp) }
    } catch {
      continue
    }
  }
  return null
}

function readWarnedBuckets(statePath: string): Record<string, number> {
  if (!statePath || !existsSync(statePath)) return {}
  try {
    return JSON.parse(readFileSync(statePath, 'utf8'))
  } catch {
    return {}
  }
}

function saveWarnedBucket(statePath: string, sessionId: string, bucket: number): void {
  if (!statePath) return
  const state = readWarnedBuckets(statePath)
  state[sessionId] = bucket
  mkdirSync(dirname(statePath), { recursive: true })
  writeFileSync(statePath, JSON.stringify(state))
}

function formatTokens(tokens: number): string {
  return tokens >= 1000 ? `${Math.round(tokens / 1000)}k` : String(tokens)
}

function formatUSD(amount: number): string {
  return amount >= 1 ? `$${amount.toFixed(2)}` : `$${amount.toFixed(3)}`
}

function buildWarnings(options: GuardOptions, sessionId: string, lastRequest: LastRequest): string[] {
  const warnings: string[] = []
  const pricePerToken = options.inputPricePerMillion / 1_000_000
  const idleMinutes = (Date.now() - lastRequest.at) / 60_000
  if (idleMinutes >= options.idleMinutes && lastRequest.contextTokens >= 30_000) {
    const rebuildCost = lastRequest.contextTokens * pricePerToken * CACHE_WRITE_MULTIPLIER
    warnings.push(
      `Cache expiré (pause de ${Math.round(idleMinutes)} min) : ce message va réécrire ${formatTokens(lastRequest.contextTokens)} tokens de contexte (~${formatUSD(rebuildCost)}). Nouvelle tâche ? Ouvre plutôt une nouvelle session.`,
    )
  }
  if (lastRequest.contextTokens >= options.thresholdTokens) {
    const bucket = Math.floor((lastRequest.contextTokens - options.thresholdTokens) / WARNING_STEP_TOKENS)
    if (bucket > (readWarnedBuckets(options.statePath)[sessionId] ?? -1)) {
      const perRequestCost = lastRequest.contextTokens * pricePerToken * CACHE_READ_MULTIPLIER
      warnings.push(
        `Contexte à ${formatTokens(lastRequest.contextTokens)} tokens : chaque requête le relit (~${formatUSD(perRequestCost)}). Changement de sujet → /clear ; même tâche → /compact en disant quoi garder.`,
      )
      saveWarnedBucket(options.statePath, sessionId, bucket)
    }
  }
  return warnings
}

function main(): void {
  const input = JSON.parse(readFileSync(0, 'utf8') || '{}')
  const transcriptPath: string = input.transcript_path ?? ''
  if (!transcriptPath || !existsSync(transcriptPath)) return
  const lastRequest = findLastMainRequest(transcriptPath)
  if (!lastRequest) return
  const warnings = buildWarnings(readOptions(), String(input.session_id ?? ''), lastRequest)
  if (warnings.length > 0) process.stdout.write(JSON.stringify({ systemMessage: `⚠ Token audit — ${warnings.join(' ')}` }))
}

try {
  main()
} catch {
  process.exit(0)
}
