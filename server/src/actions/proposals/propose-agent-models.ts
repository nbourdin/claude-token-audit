import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { formatUSD } from '../../analysis/format.ts'
import { config } from '../../config.ts'
import { requestCostUSD } from '../../cost/request-cost.ts'
import { MAIN_THREAD_ID } from '../../model/session-summary.ts'
import { resolveRepositoryRoot } from '../../transcripts/resolve-project.ts'
import type { ProposedAction } from '../action-types.ts'
import { readAgentModel } from '../agent-frontmatter.ts'
import type { ProposalContext } from './proposal-context.ts'

const TARGET_MODEL = 'sonnet'
const CHEAP_MODELS = new Set(['sonnet', 'haiku'])
const MINIMUM_MONTHLY_COST_USD = 5
const CODE_WRITING_AGENT_PATTERN = /developer|artifact-to/

type AgentSpend = { agentType: string; agentFilePath: string; costUSD: number; runs: number; mainModel: string }

function findAgentFile(cwd: string, agentType: string): string | null {
  const repositoryRoot = resolveRepositoryRoot(cwd)
  const candidates = [repositoryRoot ? join(repositoryRoot, '.claude', 'agents', `${agentType}.md`) : null, join(config.claudeUserAgentsDirectory, `${agentType}.md`)]
  return candidates.find((path) => path !== null && existsSync(path)) ?? null
}

function displayPath(path: string): string {
  return path.replace(homedir(), '~')
}

export function proposeAgentModels({ recentMetrics, rates }: ProposalContext): ProposedAction[] {
  const spendByFile = new Map<string, AgentSpend>()
  for (const metric of recentMetrics) {
    for (const subagent of metric.session.subagents) {
      const agentFilePath = findAgentFile(metric.session.cwd, subagent.agentType)
      if (!agentFilePath) continue
      const requests = metric.session.requests.filter((request) => request.threadId === subagent.threadId && request.threadId !== MAIN_THREAD_ID)
      const spend = spendByFile.get(agentFilePath) ?? { agentType: subagent.agentType, agentFilePath, costUSD: 0, runs: 0, mainModel: requests[0]?.model ?? metric.mainModel }
      spend.costUSD += requests.reduce((total, request) => total + requestCostUSD(request, rates), 0)
      spend.runs += 1
      spendByFile.set(agentFilePath, spend)
    }
  }
  return [...spendByFile.values()]
    .filter((spend) => spend.costUSD >= MINIMUM_MONTHLY_COST_USD)
    .filter((spend) => !CHEAP_MODELS.has(readAgentModel(readFileSync(spend.agentFilePath, 'utf8')) ?? ''))
    .map((spend) => {
      const savingShare = Math.max(0, 1 - rates.inputPriceFor('claude-sonnet-5-5') / rates.inputPriceFor(spend.mainModel))
      const writesCode = CODE_WRITING_AGENT_PATTERN.test(spend.agentType)
      return {
        key: `agent-model:${spend.agentFilePath}`,
        findingId: 'subagent-spend',
        title: `Passer l’agent « ${spend.agentType} » sur Sonnet`,
        rationale: `${spend.runs} exécutions pour ${formatUSD(spend.costUSD)} ces 30 derniers jours, toutes sur ${spend.mainModel} (pas de \`model:\` dans sa définition).`,
        changes: [{ target: displayPath(spend.agentFilePath), description: `ajoute \`model: ${TARGET_MODEL}\` dans le frontmatter` }],
        estimatedMonthlySavingUSD: spend.costUSD * savingShare,
        project: null,
        caveat: writesCode
          ? 'Agent qui écrit du code : compare la qualité sur quelques tâches. Fichier versionné : le changement apparaîtra dans git.'
          : 'Fichier versionné : le changement apparaîtra dans git. Annuler retire la ligne.',
        payload: { kind: 'agent-model', agentFilePath: spend.agentFilePath, agentType: spend.agentType, model: TARGET_MODEL },
      }
    })
}
