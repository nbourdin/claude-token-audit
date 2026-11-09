import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import type { JsonRecord } from './json-access.ts'
import { asRecord } from './json-access.ts'

export async function* readJsonlRecords(filePath: string): AsyncGenerator<JsonRecord> {
  const lines = createInterface({ input: createReadStream(filePath, { encoding: 'utf8' }), crlfDelay: Infinity })
  for await (const line of lines) {
    if (!line) continue
    try {
      const record = asRecord(JSON.parse(line))
      if (record) yield record
    } catch {
      continue
    }
  }
}
