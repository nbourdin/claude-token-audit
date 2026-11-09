import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditReport } from '../analysis/report-types.ts'
import { config } from '../config.ts'
import { asNumber, asRecord } from '../transcripts/json-access.ts'
import type { Advice, StoredAdvice } from './advice-schema.ts'
import { ADVICE_JSON_SCHEMA } from './advice-schema.ts'
import { buildAdviceDigest } from './build-advice-digest.ts'

const ADVICE_TIMEOUT_MS = 5 * 60 * 1000

const SYSTEM_PROMPT = `Tu es un expert de l'optimisation des coûts et du contexte de Claude Code.
Tu reçois un rapport d'audit chiffré des sessions Claude Code d'un CTO.
Rends un plan d'action priorisé par économie estimée, en français, tranché et concret.
Chaque action cite le chiffre du rapport qui la justifie et donne les étapes exactes (fichier, réglage, commande, habitude).
Connais ces leviers Claude Code : désactiver serveurs MCP/connecteurs par projet, désinstaller des skills, raccourcir CLAUDE.md et MEMORY.md, /clear entre tâches, /compact, sous-agents pour l'exploration, model: sonnet/haiku dans le frontmatter des agents, filtrer la sortie des commandes, éviter de reprendre une session après plus d'une heure de pause (cache expiré).
N'invente aucun chiffre absent du rapport. Les montants sont en équivalent prix API.`

function runClaude(prompt: string): Promise<{ advice: Advice; costUSD: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'claude',
      [
        '-p',
        '--model', config.adviceModel,
        '--strict-mcp-config',
        '--tools', '',
        '--setting-sources', '',
        '--no-session-persistence',
        '--system-prompt', SYSTEM_PROMPT,
        '--output-format', 'json',
        '--json-schema', JSON.stringify(ADVICE_JSON_SCHEMA),
      ],
      { cwd: config.dataDirectory, stdio: ['pipe', 'pipe', 'pipe'] },
    )
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => child.kill('SIGKILL'), ADVICE_TIMEOUT_MS)
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()))
    child.on('error', reject)
    child.on('close', () => {
      clearTimeout(timer)
      try {
        const result = asRecord(JSON.parse(stdout))
        const structured = result?.['structured_output']
        if (result?.['is_error'] === true || !structured) throw new Error(String(result?.['result'] ?? 'no structured output'))
        resolve({ advice: structured as Advice, costUSD: asNumber(result['total_cost_usd']) })
      } catch (error) {
        reject(new Error(`claude -p failed: ${error instanceof Error ? error.message : String(error)} ${stderr.slice(0, 500)}`))
      }
    })
    child.stdin.end(prompt)
  })
}

export async function generateAdvice(report: AuditReport): Promise<StoredAdvice> {
  mkdirSync(config.adviceDirectory, { recursive: true })
  const { advice, costUSD } = await runClaude(buildAdviceDigest(report))
  const stored: StoredAdvice = { createdAt: Date.now(), model: config.adviceModel, filter: report.filter, costUSD, advice }
  writeFileSync(join(config.adviceDirectory, `${stored.createdAt}.json`), JSON.stringify(stored, null, 2))
  return stored
}

export function readLatestAdvice(): StoredAdvice | null {
  if (!existsSync(config.adviceDirectory)) return null
  const latest = readdirSync(config.adviceDirectory)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .at(-1)
  return latest ? JSON.parse(readFileSync(join(config.adviceDirectory, latest), 'utf8')) : null
}
