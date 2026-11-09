import type { IncomingMessage } from 'node:http'

const MAX_BODY_BYTES = 64 * 1024

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  let body = ''
  for await (const chunk of request) {
    body += String(chunk)
    if (body.length > MAX_BODY_BYTES) throw new Error('request body too large')
  }
  return body ? JSON.parse(body) : null
}
