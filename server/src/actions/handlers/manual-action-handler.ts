import type { ActionHandler } from '../action-types.ts'

export const manualActionHandler: ActionHandler = {
  apply(payload) {
    if (payload.kind !== 'manual') throw new Error('unexpected payload')
    return { kind: 'none' }
  },
  undo() {},
}
