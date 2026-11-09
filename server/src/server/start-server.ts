import { createReadStream, existsSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { readActionJournal } from '../actions/action-journal.ts'
import { applyAction, undoAction } from '../actions/apply-action.ts'
import { buildActionProposals } from '../actions/build-action-proposals.ts'
import { buildAppliedActionViews } from '../actions/verification/build-applied-action-views.ts'
import { readLatestAdvice, generateAdvice } from '../advice/generate-advice.ts'
import { asRecord, asString } from '../transcripts/json-access.ts'
import { buildMarkerComparisons } from '../analysis/build-marker-comparisons.ts'
import { buildReport } from '../analysis/build-report.ts'
import { buildSessionDetail } from '../analysis/build-session-detail.ts'
import type { ReportFilter } from '../analysis/report-types.ts'
import { config } from '../config.ts'
import { runIngest } from '../ingest/run-ingest.ts'
import { addMarker, readMarkers, removeMarker } from '../markers/marker-store.ts'
import { parseNewMarker } from '../markers/parse-new-marker.ts'
import type { SessionSummary } from '../model/session-summary.ts'
import { readJsonBody } from './read-json-body.ts'

const DEFAULT_COMPARISON_WINDOW_DAYS = 7
const MARKERS_PREFIX = '/api/markers/'
const UNDO_ACTION_PATTERN = /^\/api\/actions\/([^/]+)\/undo$/

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

let sessions: SessionSummary[] = []
let lastIngestAt = 0
let adviceInProgress = false

async function refreshSessions(): Promise<{ parsedFiles: number; durationMs: number }> {
  const result = await runIngest()
  sessions = result.sessions
  lastIngestAt = Date.now()
  return { parsedFiles: result.parsedFiles, durationMs: result.durationMs }
}

function filterFrom(url: URL): ReportFilter {
  const days = url.searchParams.get('days')
  return {
    sinceDays: days && days !== 'all' ? Number(days) : null,
    project: url.searchParams.get('project') || null,
  }
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
}

function serveStatic(response: ServerResponse, pathname: string): void {
  if (!existsSync(config.webDistDirectory)) {
    response.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' }).end('Dashboard not built: run `pnpm build`, or `pnpm dev` and open the Vite URL.')
    return
  }
  const requested = join(config.webDistDirectory, normalize(pathname))
  const isFile = requested.startsWith(config.webDistDirectory) && existsSync(requested) && statSync(requested).isFile()
  const filePath = isFile ? requested : join(config.webDistDirectory, 'index.html')
  response.writeHead(200, { 'content-type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream' })
  createReadStream(filePath).pipe(response)
}

async function handleApi(request: IncomingMessage, response: ServerResponse, url: URL): Promise<void> {
  const { pathname } = url
  if (pathname === '/api/report' && request.method === 'GET') {
    return sendJson(response, 200, { ...buildReport(sessions, filterFrom(url)), lastIngestAt, markers: readMarkers() })
  }
  if (pathname === '/api/actions' && request.method === 'GET') {
    return sendJson(response, 200, { proposals: buildActionProposals(sessions), applied: buildAppliedActionViews(sessions, readActionJournal()) })
  }
  if (pathname === '/api/actions/apply' && request.method === 'POST') {
    const key = asString(asRecord(await readJsonBody(request))?.['key'])
    return key ? sendJson(response, 200, { appliedId: applyAction(sessions, key).id }) : sendJson(response, 400, { error: 'key is required' })
  }
  const undoMatch = pathname.match(UNDO_ACTION_PATTERN)
  if (undoMatch && request.method === 'POST') return sendJson(response, 200, { undoneId: undoAction(decodeURIComponent(undoMatch[1] ?? '')).id })
  if (pathname === '/api/markers' && request.method === 'GET') {
    const windowDays = Number(url.searchParams.get('windowDays')) || DEFAULT_COMPARISON_WINDOW_DAYS
    return sendJson(response, 200, { comparisons: buildMarkerComparisons(sessions, readMarkers(), windowDays) })
  }
  if (pathname === '/api/markers' && request.method === 'POST') {
    const parsed = parseNewMarker(await readJsonBody(request))
    return typeof parsed === 'string' ? sendJson(response, 400, { error: parsed }) : sendJson(response, 201, { marker: addMarker(parsed) })
  }
  if (pathname.startsWith(MARKERS_PREFIX) && request.method === 'DELETE') {
    const removed = removeMarker(decodeURIComponent(pathname.slice(MARKERS_PREFIX.length)))
    return removed ? sendJson(response, 200, { removed: true }) : sendJson(response, 404, { error: 'marker not found' })
  }
  if (pathname === '/api/ingest' && request.method === 'POST') return sendJson(response, 200, await refreshSessions())
  if (pathname.startsWith('/api/sessions/') && request.method === 'GET') {
    const detail = buildSessionDetail(sessions, decodeURIComponent(pathname.slice('/api/sessions/'.length)))
    return detail ? sendJson(response, 200, detail) : sendJson(response, 404, { error: 'session not found' })
  }
  if (pathname === '/api/advice' && request.method === 'GET') return sendJson(response, 200, { advice: readLatestAdvice(), inProgress: adviceInProgress })
  if (pathname === '/api/advice' && request.method === 'POST') {
    if (adviceInProgress) return sendJson(response, 409, { error: 'advice generation already running' })
    adviceInProgress = true
    try {
      return sendJson(response, 200, { advice: await generateAdvice(buildReport(sessions, filterFrom(url))) })
    } finally {
      adviceInProgress = false
    }
  }
  sendJson(response, 404, { error: 'unknown endpoint' })
}

export async function startServer(): Promise<void> {
  const { parsedFiles, durationMs } = await refreshSessions()
  console.log(`Loaded ${sessions.length} sessions (${parsedFiles} re-parsed) in ${(durationMs / 1000).toFixed(1)}s`)
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', `http://${config.host}`)
    if (!url.pathname.startsWith('/api/')) return serveStatic(response, url.pathname)
    handleApi(request, response, url).catch((error: unknown) => {
      console.error(error)
      sendJson(response, 500, { error: error instanceof Error ? error.message : String(error) })
    })
  })
  server.listen(config.port, config.host, () => console.log(`Dashboard: http://${config.host}:${config.port}`))
}
