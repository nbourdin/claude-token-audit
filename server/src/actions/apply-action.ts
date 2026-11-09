import { randomUUID } from 'node:crypto'
import { addMarker, removeMarker } from '../markers/marker-store.ts'
import type { SessionSummary } from '../model/session-summary.ts'
import { actionHandlers } from './action-handlers.ts'
import { readActionJournal, writeActionJournal } from './action-journal.ts'
import type { AppliedAction } from './action-types.ts'
import { buildActionProposals } from './build-action-proposals.ts'

export function applyAction(allSessions: SessionSummary[], proposalKey: string): AppliedAction {
  const proposal = buildActionProposals(allSessions).find((candidate) => candidate.key === proposalKey)
  if (!proposal) throw new Error(`no pending action with key "${proposalKey}"`)
  const undo = actionHandlers[proposal.payload.kind].apply(proposal.payload)
  const marker = addMarker({ at: Date.now(), label: `Action : ${proposal.title}`, project: proposal.project })
  const applied: AppliedAction = {
    id: randomUUID(),
    key: proposal.key,
    kind: proposal.payload.kind,
    title: proposal.title,
    project: proposal.project,
    estimatedMonthlySavingUSD: proposal.estimatedMonthlySavingUSD,
    appliedAt: Date.now(),
    markerId: marker.id,
    undo,
    undoneAt: null,
  }
  writeActionJournal([applied, ...readActionJournal()])
  return applied
}

export function undoAction(appliedActionId: string): AppliedAction {
  const journal = readActionJournal()
  const applied = journal.find((action) => action.id === appliedActionId)
  if (!applied) throw new Error(`no applied action with id "${appliedActionId}"`)
  if (applied.undoneAt !== null) throw new Error('this action was already undone')
  actionHandlers[applied.kind].undo(applied.undo)
  if (applied.markerId) removeMarker(applied.markerId)
  const undone = { ...applied, undoneAt: Date.now() }
  writeActionJournal(journal.map((action) => (action.id === applied.id ? undone : action)))
  return undone
}
