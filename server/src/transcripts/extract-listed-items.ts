import type { ListedItem } from '../model/session-summary.ts'

const SKILLS_MARKER = 'The following skills are available for use with the Skill tool'
const DEFERRED_TOOLS_MARKER = 'The following deferred tools are now available'
const SKILL_LINE_PATTERN = /^- (\S+?)(?:: |:$|$)/
const TOOL_NAME_PATTERN = /^[A-Za-z0-9_.:-]+$/

function linesAfterMarker(text: string, marker: string): string[] {
  const markerIndex = text.indexOf(marker)
  if (markerIndex < 0) return []
  return text.slice(markerIndex).split('\n').slice(1)
}

export function extractListedSkills(text: string): ListedItem[] {
  const skills: ListedItem[] = []
  let started = false
  for (const line of linesAfterMarker(text, SKILLS_MARKER)) {
    const match = line.match(SKILL_LINE_PATTERN)
    if (match) {
      started = true
      skills.push({ name: (match[1] ?? '').trim(), chars: line.length + 1 })
      continue
    }
    if (started && line.trim() === '') break
  }
  return skills
}

export function extractDeferredTools(text: string): ListedItem[] {
  const tools: ListedItem[] = []
  let started = false
  for (const line of linesAfterMarker(text, DEFERRED_TOOLS_MARKER)) {
    const name = line.trim()
    if (name && TOOL_NAME_PATTERN.test(name)) {
      started = true
      tools.push({ name, chars: line.length + 1 })
      continue
    }
    if (started) break
  }
  return tools
}
