import { buildReport } from './analysis/build-report.ts'
import { formatTokens, formatUSD } from './analysis/format.ts'
import { applyAction } from './actions/apply-action.ts'
import { buildActionProposals } from './actions/build-action-proposals.ts'
import { generateAdvice } from './advice/generate-advice.ts'
import { runIngest } from './ingest/run-ingest.ts'
import { startServer } from './server/start-server.ts'

async function ingestCommand(): Promise<void> {
  const result = await runIngest((done, total) => {
    if (done % 50 === 0 || done === total) process.stdout.write(`\r  ${done}/${total} transcripts`)
  })
  process.stdout.write('\n')
  console.log(`${result.sessions.length} sessions (${result.parsedFiles} parsed, ${result.cachedFiles} from cache) in ${(result.durationMs / 1000).toFixed(1)}s`)
}

async function reportCommand(): Promise<void> {
  const { sessions } = await runIngest()
  const sinceDays = Number(process.argv[3] ?? 30)
  const report = buildReport(sessions, { sinceDays, project: null })
  const { totals } = report
  console.log(`Last ${sinceDays} days: ${formatUSD(totals.costUSD)} · ${totals.sessions} sessions · ${totals.requests} requests · baseline ${formatTokens(totals.averageBaselineTokens)} · cache hit ${(totals.cacheHitRatio * 100).toFixed(1)} %`)
  for (const finding of report.findings) {
    console.log(`\n[${finding.severity}] ${finding.title} — ${formatUSD(finding.impactUSD)}`)
    console.log(`  ${finding.summary}`)
    for (const evidence of finding.evidence.slice(0, 6)) console.log(`   · ${evidence.label} — ${evidence.value}${evidence.detail ? ` (${evidence.detail})` : ''}`)
  }
}

async function adviseCommand(): Promise<void> {
  const { sessions } = await runIngest()
  const sinceDays = Number(process.argv[3] ?? 30)
  console.log(`Asking Claude for advice on the last ${sinceDays} days…`)
  const stored = await generateAdvice(buildReport(sessions, { sinceDays, project: null }))
  console.log(`\n${stored.advice.headline}\n`)
  for (const action of stored.advice.actions) {
    console.log(`▸ [${action.effort}] ${action.title} (~${formatUSD(action.estimatedMonthlySavingUSD)}/mois)\n  ${action.why}`)
    for (const step of action.steps) console.log(`    - ${step}`)
  }
  console.log(`\nAdvice cost: ${formatUSD(stored.costUSD)}`)
}

async function actionsCommand(): Promise<void> {
  const { sessions } = await runIngest()
  const keyToApply = process.argv[3]
  if (keyToApply) {
    const applied = applyAction(sessions, keyToApply)
    console.log(`Applied: ${applied.title} (journal id ${applied.id})`)
    return
  }
  for (const proposal of buildActionProposals(sessions)) {
    console.log(`\n${proposal.key}\n  ${proposal.title} — ~${formatUSD(proposal.estimatedMonthlySavingUSD)}/mois\n  ${proposal.rationale}`)
    for (const change of proposal.changes) console.log(`   · ${change.target} : ${change.description}`)
  }
}

const commands: Record<string, () => Promise<void>> = {
  actions: actionsCommand,
  ingest: ingestCommand,
  report: reportCommand,
  advise: adviseCommand,
  serve: startServer,
  start: startServer,
}

const commandName = process.argv[2] ?? 'start'
const command = commands[commandName]
if (!command) {
  console.error(`Unknown command "${commandName}". Available: ${Object.keys(commands).join(', ')}`)
  process.exit(1)
}
await command()
