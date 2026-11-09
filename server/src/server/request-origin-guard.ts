import type { IncomingMessage } from 'node:http'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])
const SAFE_METHODS = new Set(['GET', 'HEAD'])

function isLocalAuthority(value: string, withScheme: boolean): boolean {
  try {
    return LOCAL_HOSTNAMES.has(new URL(withScheme ? value : `http://${value}`).hostname)
  } catch {
    return false
  }
}

export function rejectionReason(request: IncomingMessage): string | null {
  const host = request.headers.host
  if (!host || !isLocalAuthority(host, false)) return 'requests must target localhost'
  const origin = request.headers.origin
  if (origin !== undefined && !isLocalAuthority(origin, true)) return 'cross-origin requests are not allowed'
  if (origin === undefined && !SAFE_METHODS.has(request.method ?? '') && request.headers['sec-fetch-site'] === 'cross-site') return 'cross-origin requests are not allowed'
  return null
}
