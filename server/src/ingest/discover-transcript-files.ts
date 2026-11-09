import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export type TranscriptFile = {
  sessionId: string
  path: string
  fingerprint: string
}

function directoryFingerprint(directory: string): string {
  if (!existsSync(directory)) return ''
  return readdirSync(directory)
    .map((fileName) => {
      const stats = statSync(join(directory, fileName))
      return `${fileName}:${stats.size}:${stats.mtimeMs}`
    })
    .join('|')
}

export function discoverTranscriptFiles(transcriptsDirectory: string): TranscriptFile[] {
  const files: TranscriptFile[] = []
  for (const projectFolder of readdirSync(transcriptsDirectory)) {
    const projectPath = join(transcriptsDirectory, projectFolder)
    if (!statSync(projectPath).isDirectory()) continue
    for (const fileName of readdirSync(projectPath)) {
      if (!fileName.endsWith('.jsonl')) continue
      const path = join(projectPath, fileName)
      const stats = statSync(path)
      const sessionId = fileName.slice(0, -'.jsonl'.length)
      const subagentsFingerprint = directoryFingerprint(join(projectPath, sessionId, 'subagents'))
      files.push({ sessionId, path, fingerprint: `${stats.size}:${stats.mtimeMs}:${subagentsFingerprint.length}:${subagentsFingerprint.slice(-200)}` })
    }
  }
  return files
}
