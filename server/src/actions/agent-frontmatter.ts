const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---/
const MODEL_LINE_PATTERN = /^model:\s*(.*)$/m

export function readAgentModel(content: string): string | null {
  const frontmatter = content.match(FRONTMATTER_PATTERN)?.[1]
  return frontmatter?.match(MODEL_LINE_PATTERN)?.[1]?.trim() || null
}

export function withAgentModel(content: string, model: string | null): string {
  const frontmatterMatch = content.match(FRONTMATTER_PATTERN)
  if (!frontmatterMatch) throw new Error('agent file has no frontmatter')
  const frontmatter = frontmatterMatch[1] ?? ''
  const withoutModel = frontmatter
    .split('\n')
    .filter((line) => !MODEL_LINE_PATTERN.test(line))
    .join('\n')
  const nextFrontmatter = model === null ? withoutModel : `${withoutModel}\nmodel: ${model}`
  return content.replace(FRONTMATTER_PATTERN, `---\n${nextFrontmatter}\n---`)
}
