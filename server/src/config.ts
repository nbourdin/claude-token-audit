import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const dataDirectory = process.env['AUDIT_DATA_DIR'] ?? join(repositoryRoot, 'data')
const claudeHome = process.env['AUDIT_CLAUDE_HOME'] ?? join(homedir(), '.claude')

export const config = {
  repositoryRoot,
  transcriptsDirectory: process.env['CLAUDE_TRANSCRIPTS_DIR'] ?? join(homedir(), '.claude', 'projects'),
  dataDirectory,
  sessionCacheDirectory: join(dataDirectory, 'sessions'),
  adviceDirectory: join(dataDirectory, 'advice'),
  actionsJournalPath: join(dataDirectory, 'actions.json'),
  guardStatePath: join(dataDirectory, 'guard-state.json'),
  webDistDirectory: join(repositoryRoot, 'web', 'dist'),
  claudeHome,
  claudeSettingsPath: join(claudeHome, 'settings.json'),
  claudeSkillsDirectory: join(claudeHome, 'skills'),
  claudeSkillsArchiveDirectory: join(claudeHome, 'skills-archived-by-token-audit'),
  claudeUserAgentsDirectory: join(claudeHome, 'agents'),
  claudeJsonPath: process.env['AUDIT_CLAUDE_JSON'] ?? join(homedir(), '.claude.json'),
  contextGuardScriptPath: join(repositoryRoot, 'server', 'src', 'hooks', 'context-guard.ts'),
  host: '127.0.0.1',
  port: Number(process.env['AUDIT_API_PORT'] ?? 4747),
  adviceModel: process.env['ADVICE_MODEL'] ?? 'sonnet',
  charsPerToken: 3.5,
}
