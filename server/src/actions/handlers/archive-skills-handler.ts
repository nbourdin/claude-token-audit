import { existsSync, mkdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { config } from '../../config.ts'
import type { ActionHandler } from '../action-types.ts'

const SAFE_SKILL_NAME = /^[A-Za-z0-9._-]+$/

export const archiveSkillsHandler: ActionHandler = {
  apply(payload) {
    if (payload.kind !== 'archive-skills') throw new Error('unexpected payload')
    mkdirSync(config.claudeSkillsArchiveDirectory, { recursive: true })
    const moves: Array<{ from: string; to: string }> = []
    for (const skillName of payload.skillNames) {
      if (!SAFE_SKILL_NAME.test(skillName)) continue
      const from = join(config.claudeSkillsDirectory, skillName)
      const to = join(config.claudeSkillsArchiveDirectory, skillName)
      if (!existsSync(from) || existsSync(to)) continue
      renameSync(from, to)
      moves.push({ from, to })
    }
    return { kind: 'moves', moves }
  },
  undo(record) {
    if (record.kind !== 'moves') throw new Error('unexpected undo record')
    for (const { from, to } of record.moves) {
      if (existsSync(to) && !existsSync(from)) renameSync(to, from)
    }
  },
}
