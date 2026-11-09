import type { JsonRecord } from './json-access.ts'
import { asArray, asRecord, asString, readPath } from './json-access.ts'
import { extractDeferredTools, extractListedSkills } from './extract-listed-items.ts'
import type { SessionBuilder } from './session-builder.ts'
import { splitContextSections } from './split-context-sections.ts'

const CORE_PROMPT_BLOCKS = 2

function collectListedItems(builder: SessionBuilder, text: string): void {
  if (builder.listedSkills.length === 0) builder.listedSkills = extractListedSkills(text)
  if (builder.deferredTools.length === 0) builder.deferredTools = extractDeferredTools(text)
}

export function handleRequestShapeRecord(builder: SessionBuilder, record: JsonRecord): void {
  if (builder.hasShape) return
  builder.hasShape = true
  const systemBlocks = asArray(readPath(record, 'shape', 'system'))
  systemBlocks.forEach((block, index) => {
    const text = asString(readPath(block, 'text'))
    if (index < CORE_PROMPT_BLOCKS) {
      builder.contextSections.push({ label: 'Claude Code core prompt', kind: 'core-prompt', chars: text.length })
      return
    }
    collectListedItems(builder, text)
    builder.contextSections.push(...splitContextSections(text, 'Claude Code core prompt', 'core-prompt'))
  })
  const tools = asArray(readPath(record, 'shape', 'tools'))
  for (const tool of tools) {
    const name = asString(readPath(tool, 'name'))
    if (!name || readPath(tool, 'defer_loading') === true) continue
    builder.toolDefinitions.push({ name, chars: JSON.stringify(tool).length })
  }
  const toolChars = builder.toolDefinitions.reduce((total, tool) => total + tool.chars, 0)
  builder.contextSections.push({ label: 'Tool definitions', kind: 'tool-definitions', chars: toolChars })
}

export function handleRequestRecord(builder: SessionBuilder, record: JsonRecord, at: number): void {
  const shapeHash = asString(record['shapeHash'])
  if (!shapeHash) return
  if (builder.lastShapeHash && shapeHash !== builder.lastShapeHash) builder.shapeChanges.push({ at })
  builder.lastShapeHash = shapeHash
}

export function handleRequestBlobRecord(builder: SessionBuilder, record: JsonRecord): void {
  if (builder.hasSeenMainRequest) return
  const isSystemMessage = readPath(record, 'message', 'role') === 'system'
  for (const block of asArray(readPath(record, 'message', 'content'))) {
    const text = asString(asRecord(block)?.['text'])
    collectListedItems(builder, text)
    if (isSystemMessage) builder.contextSections.push(...splitContextSections(text, 'Environment', 'core-prompt'))
    else if (text.startsWith('<system-reminder>')) builder.contextSections.push(...splitContextSections(text, 'System reminder', 'session-context'))
  }
}
