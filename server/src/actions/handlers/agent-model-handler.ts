import { readFileSync, writeFileSync } from 'node:fs'
import type { ActionHandler } from '../action-types.ts'
import { readAgentModel, withAgentModel } from '../agent-frontmatter.ts'

export const agentModelHandler: ActionHandler = {
  apply(payload) {
    if (payload.kind !== 'agent-model') throw new Error('unexpected payload')
    const content = readFileSync(payload.agentFilePath, 'utf8')
    const previousModel = readAgentModel(content)
    writeFileSync(payload.agentFilePath, withAgentModel(content, payload.model))
    return { kind: 'agent-model', agentFilePath: payload.agentFilePath, previousModel }
  },
  undo(record) {
    if (record.kind !== 'agent-model') throw new Error('unexpected undo record')
    const content = readFileSync(record.agentFilePath, 'utf8')
    writeFileSync(record.agentFilePath, withAgentModel(content, record.previousModel))
  },
}
