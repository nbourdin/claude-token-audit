import { buildReport } from '../analysis/build-report.ts'
import { filterSessions } from '../analysis/filter-sessions.ts'
import { computeSessionMetrics } from '../analysis/session-metrics.ts'
import { calibrateModelRates } from '../cost/model-rates.ts'
import type { SessionSummary } from '../model/session-summary.ts'
import { activeAppliedKeys, readActionJournal } from './action-journal.ts'
import type { ProposedAction } from './action-types.ts'
import { proposeAgentModels } from './proposals/propose-agent-models.ts'
import { proposeContextGuard } from './proposals/propose-context-guard.ts'
import { proposeManualActions } from './proposals/propose-manual-actions.ts'
import { proposeMcpServerRemovals } from './proposals/propose-mcp-server-removals.ts'
import { proposePluginDisables } from './proposals/propose-plugin-disables.ts'
import { proposeSkillArchives } from './proposals/propose-skill-archives.ts'
import type { ProposalContext } from './proposals/proposal-context.ts'
import { PROPOSAL_WINDOW_DAYS } from './proposals/proposal-context.ts'

const PROPOSERS: Array<(context: ProposalContext) => ProposedAction[]> = [
  proposeContextGuard,
  proposeMcpServerRemovals,
  proposePluginDisables,
  proposeSkillArchives,
  proposeAgentModels,
  proposeManualActions,
]

export function buildActionProposals(allSessions: SessionSummary[]): ProposedAction[] {
  const rates = calibrateModelRates(allSessions)
  const filter = { sinceDays: PROPOSAL_WINDOW_DAYS, project: null }
  const context: ProposalContext = {
    allSessions,
    rates,
    recentMetrics: filterSessions(allSessions, filter).map((session) => computeSessionMetrics(session, rates)),
    recentReport: buildReport(allSessions, filter),
  }
  const appliedKeys = activeAppliedKeys(readActionJournal())
  return PROPOSERS.flatMap((propose) => propose(context))
    .filter((proposal) => !appliedKeys.has(proposal.key))
    .sort((left, right) => right.estimatedMonthlySavingUSD - left.estimatedMonthlySavingUSD)
}
