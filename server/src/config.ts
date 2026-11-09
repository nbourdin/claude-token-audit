import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export const config = {
  repositoryRoot,
  transcriptsDirectory: process.env['CLAUDE_TRANSCRIPTS_DIR'] ?? join(homedir(), '.claude', 'projects'),
  dataDirectory: join(repositoryRoot, 'data'),
  sessionCacheDirectory: join(repositoryRoot, 'data', 'sessions'),
  adviceDirectory: join(repositoryRoot, 'data', 'advice'),
  webDistDirectory: join(repositoryRoot, 'web', 'dist'),
  host: '127.0.0.1',
  port: Number(process.env['AUDIT_API_PORT'] ?? 4747),
  adviceModel: process.env['ADVICE_MODEL'] ?? 'sonnet',
  charsPerToken: 3.5,
}
