import { homedir } from 'node:os'

export type ContextFileCategory = 'memory-index' | 'memory-note' | 'instructions' | 'claude-config'

export const OVERSIZE_THRESHOLD_TOKENS: Record<ContextFileCategory, number> = {
  'memory-index': 3_000,
  'memory-note': 1_500,
  instructions: 4_000,
  'claude-config': 3_000,
}

const PROJECT_MEMORY_PATTERN = /\/\.claude\/projects\/-Users-[^-/]+-([^/]+)\/memory\/(.+)$/
const WORKTREE_SEGMENT_PATTERN = /\/\.claude\/worktrees\/[^/]+/

export function contextFileCategory(path: string): ContextFileCategory | null {
  if (/(^|\/)MEMORY\.md$/.test(path)) return 'memory-index'
  if (/\/memory\/[^/]+\.md$/.test(path)) return 'memory-note'
  if (/(^|\/)(CLAUDE|AGENTS)(\.local)?\.md$/.test(path)) return 'instructions'
  if (/\/\.claude\/(rules|agents|commands|skills)\/.+\.md$/.test(path)) return 'claude-config'
  return null
}

export function displayContextFilePath(path: string): string {
  const memory = path.match(PROJECT_MEMORY_PATTERN)
  if (memory) return `mémoire ${memory[1]} / ${memory[2]}`
  return path.replace(WORKTREE_SEGMENT_PATTERN, '').replace(homedir(), '~')
}
