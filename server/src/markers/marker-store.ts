import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { config } from '../config.ts'
import type { ChangeMarker, NewChangeMarker } from './change-marker.ts'

const markersPath = join(config.dataDirectory, 'markers.json')

export function readMarkers(): ChangeMarker[] {
  if (!existsSync(markersPath)) return []
  try {
    const markers: ChangeMarker[] = JSON.parse(readFileSync(markersPath, 'utf8'))
    return markers.sort((left, right) => right.at - left.at)
  } catch {
    return []
  }
}

function writeMarkers(markers: ChangeMarker[]): void {
  mkdirSync(config.dataDirectory, { recursive: true })
  writeFileSync(markersPath, JSON.stringify(markers, null, 2))
}

export function addMarker(newMarker: NewChangeMarker): ChangeMarker {
  const marker: ChangeMarker = { ...newMarker, id: randomUUID(), createdAt: Date.now() }
  writeMarkers([...readMarkers(), marker])
  return marker
}

export function removeMarker(markerId: string): boolean {
  const markers = readMarkers()
  const remaining = markers.filter((marker) => marker.id !== markerId)
  if (remaining.length === markers.length) return false
  writeMarkers(remaining)
  return true
}
