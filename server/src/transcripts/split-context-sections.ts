import type { ContextSection, ContextSectionKind } from '../model/session-summary.ts'

type SectionMarker = {
  index: number
  label: string
  kind: ContextSectionKind
  headingLevel: number
  filePath?: string
}

const FIXED_MARKERS: Array<{ pattern: RegExp; label: string; kind: ContextSectionKind }> = [
  { pattern: /^# MCP Server Instructions/gm, label: 'MCP server instructions', kind: 'mcp-instructions' },
  { pattern: /The following skills are available for use with the Skill tool/g, label: 'Skills listing', kind: 'skills' },
  { pattern: /The following deferred tools are now available/g, label: 'Deferred tools listing', kind: 'deferred-tools' },
  { pattern: /^# (?:Memory|auto memory)\b/gm, label: 'Memory instructions', kind: 'memory' },
  { pattern: /^# (?:userEmail|currentDate|gitStatus)\b/gm, label: 'Session context', kind: 'session-context' },
]

const FILE_CONTENTS_PATTERN = /Contents of (\S+?) \(/g
const HEADING_PATTERN = /^(#{1,2}) (.{3,60})$/gm

function fileSectionKind(filePath: string): ContextSectionKind {
  return /memory/i.test(filePath) ? 'memory' : 'project-instructions'
}

const PROJECT_SLUG_PREFIX = /^-Users-[^-]+-/

function shortenPath(filePath: string): string {
  const parts = filePath.split('/')
  const fileName = parts.at(-1) ?? filePath
  const owner = parts.at(fileName === 'MEMORY.md' ? -3 : -2) ?? ''
  return `${fileName} · ${owner.replace(PROJECT_SLUG_PREFIX, '')}`
}

function collectMarkers(text: string): SectionMarker[] {
  const markers: SectionMarker[] = []
  for (const { pattern, label, kind } of FIXED_MARKERS) {
    for (const match of text.matchAll(pattern)) markers.push({ index: match.index, label, kind, headingLevel: 0 })
  }
  for (const match of text.matchAll(FILE_CONTENTS_PATTERN)) {
    const filePath = match[1] ?? ''
    markers.push({ index: match.index, label: shortenPath(filePath), kind: fileSectionKind(filePath), headingLevel: 0, filePath })
  }
  for (const match of text.matchAll(HEADING_PATTERN)) {
    const heading = (match[2] ?? '').trim()
    if (markers.some((marker) => Math.abs(marker.index - match.index) < 4)) continue
    markers.push({ index: match.index, label: heading, kind: 'core-prompt', headingLevel: (match[1] ?? '').length })
  }
  return markers.sort((left, right) => left.index - right.index)
}

function normalizeHeadingMarkers(markers: SectionMarker[]): SectionMarker[] {
  let insideFile = false
  let insideMcpInstructions = false
  const normalized: SectionMarker[] = []
  for (const marker of markers) {
    if (marker.headingLevel === 0) {
      insideFile = marker.kind === 'project-instructions' || (marker.kind === 'memory' && marker.label.includes('.md'))
      insideMcpInstructions = marker.kind === 'mcp-instructions'
      normalized.push(marker)
      continue
    }
    if (insideFile) continue
    if (marker.headingLevel === 1) insideMcpInstructions = false
    normalized.push(insideMcpInstructions ? { ...marker, kind: 'mcp-instructions', label: `MCP instructions: ${marker.label}` } : marker)
  }
  return normalized
}

export function splitContextSections(text: string, defaultLabel: string, defaultKind: ContextSectionKind): ContextSection[] {
  const markers = normalizeHeadingMarkers(collectMarkers(text))
  const sections: ContextSection[] = []
  const firstIndex = markers[0]?.index ?? text.length
  if (firstIndex > 0) sections.push({ label: defaultLabel, kind: defaultKind, chars: firstIndex })
  markers.forEach((marker, position) => {
    const end = markers[position + 1]?.index ?? text.length
    sections.push({ label: marker.label, kind: marker.kind, chars: end - marker.index, ...(marker.filePath ? { filePath: marker.filePath } : {}) })
  })
  return sections
}

export function mergeSections(sections: ContextSection[]): ContextSection[] {
  const merged = new Map<string, ContextSection>()
  for (const section of sections) {
    const key = `${section.kind}:${section.label}`
    const existing = merged.get(key)
    if (existing) existing.chars += section.chars
    else merged.set(key, { ...section })
  }
  return [...merged.values()]
}
