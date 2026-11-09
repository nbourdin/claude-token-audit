import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateDemoWorkspace } from './generate-demo-workspace.ts'

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const workspace = generateDemoWorkspace(join(repositoryRoot, 'data-demo'))

process.env['CLAUDE_TRANSCRIPTS_DIR'] = workspace.transcriptsDirectory
process.env['AUDIT_CLAUDE_HOME'] = workspace.claudeHome
process.env['AUDIT_CLAUDE_JSON'] = workspace.claudeJsonPath
process.env['AUDIT_DATA_DIR'] = workspace.dataDirectory
process.env['AUDIT_API_PORT'] ??= '4748'

console.log('Demo workspace generated in data-demo/ (fictional sessions, sandboxed Claude config).')
const { startServer } = await import('../server/start-server.ts')
await startServer()
