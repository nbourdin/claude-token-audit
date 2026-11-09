import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { config } from '../config.ts'
import type { AppliedAction } from './action-types.ts'
import { writeJsonAtomically } from './json-file.ts'

export function readActionJournal(): AppliedAction[] {
  if (!existsSync(config.actionsJournalPath)) return []
  const journal: AppliedAction[] = JSON.parse(readFileSync(config.actionsJournalPath, 'utf8'))
  return journal.sort((left, right) => right.appliedAt - left.appliedAt)
}

export function writeActionJournal(journal: AppliedAction[]): void {
  mkdirSync(dirname(config.actionsJournalPath), { recursive: true })
  writeJsonAtomically(config.actionsJournalPath, journal)
}

export function activeAppliedKeys(journal: AppliedAction[]): Set<string> {
  return new Set(journal.filter((action) => action.undoneAt === null).map((action) => action.key))
}
