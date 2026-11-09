import { existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

export type ResolvedProject = {
  projectName: string
  worktree: string | null
}

const WORKTREE_PATTERN = /\/\.claude\/worktrees\/([^/]+)/
const projectRootCache = new Map<string, string>()

function findGitRoot(directory: string): string {
  const cached = projectRootCache.get(directory)
  if (cached !== undefined) return cached
  let current = directory
  while (current !== dirname(current)) {
    if (existsSync(join(current, '.git'))) break
    current = dirname(current)
  }
  const root = current === dirname(current) ? directory : current
  projectRootCache.set(directory, root)
  return root
}

export function resolveProject(cwd: string): ResolvedProject {
  if (!cwd) return { projectName: 'unknown', worktree: null }
  if (cwd.includes('scratch-workspaces')) return { projectName: 'scratch', worktree: null }
  const worktreeMatch = cwd.match(WORKTREE_PATTERN)
  const repositoryPath = worktreeMatch ? cwd.slice(0, worktreeMatch.index) : cwd
  return { projectName: basename(findGitRoot(repositoryPath)), worktree: worktreeMatch?.[1] ?? null }
}
