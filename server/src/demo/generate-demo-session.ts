import type { DemoProject } from './demo-scenario.ts'
import { DEMO_AGENT, MCP_SERVERS, NOTION_CONNECTOR_ID, PROMPTS, USER_SKILLS } from './demo-scenario.ts'
import { buildStartupContext, fillerText } from './demo-startup-context.ts'
import type { DemoRecord, DemoThread } from './demo-thread.ts'
import { addContextChars, advance, createDemoThread, pushRecord, recordAssistantRequest, recordCompaction, recordToolResult, recordUserPrompt } from './demo-thread.ts'
import type { SeededRandom } from './seeded-random.ts'

const SECOND = 1000
const MINUTE = 60 * SECOND
const COMPACTION_THRESHOLD_TOKENS = 190_000

export type DemoSessionInput = {
  sessionId: string
  project: DemoProject
  startedAt: number
  model: string
  includesLegacyServer: boolean
  random: SeededRandom
}

export type DemoSubagent = { agentId: string; records: DemoRecord[]; meta: { agentType: string; description: string } }

export type DemoSession = { records: DemoRecord[]; subagents: DemoSubagent[] }

type ToolStep = { name: string; input: DemoRecord; resultChars: number; isError: boolean }

function nextToolStep(input: DemoSessionInput): ToolStep {
  const { random, project } = input
  const roll = random.next()
  if (roll < 0.32) {
    const file = random.chance(0.6) ? random.pick(project.hotFiles) : `src/${random.pick(['utils', 'shared', 'domain', 'ui'])}/module-${random.integer(1, 40)}.ts`
    return { name: 'Read', input: { file_path: `${project.cwd}/${file}` }, resultChars: random.integer(3_000, 16_000), isError: false }
  }
  if (roll < 0.58) {
    const command = random.pick(['pnpm test', 'pnpm typecheck', 'git status', 'git diff', 'pnpm lint', 'pnpm build'])
    const isNoisy = command !== 'git status' && random.chance(0.12)
    return { name: 'Bash', input: { command }, resultChars: isNoisy ? random.integer(30_000, 95_000) : random.integer(400, 4_000), isError: random.chance(0.07) }
  }
  if (roll < 0.78) return { name: 'Edit', input: { file_path: `${project.cwd}/${random.pick(project.hotFiles)}` }, resultChars: random.integer(200, 600), isError: random.chance(0.05) }
  if (roll < 0.92) return { name: 'Grep', input: { pattern: random.pick(['TODO', 'formatAmount', 'useCart', 'invoice']) }, resultChars: random.integer(1_500, 7_000), isError: false }
  return { name: 'Glob', input: { pattern: '**/*.test.ts' }, resultChars: random.integer(500, 1_500), isError: false }
}

function runToolStep(thread: DemoThread, step: ToolStep, random: SeededRandom, toolUseId: string): void {
  recordAssistantRequest(thread, { outputTokens: random.integer(120, 1_400), toolUse: { id: toolUseId, name: step.name, input: step.input } })
  advance(thread, random.between(3, 25) * SECOND)
  recordToolResult(thread, { toolUseId, chars: step.resultChars, isError: step.isError })
}

function generateSubagent(input: DemoSessionInput, at: number, index: number): DemoSubagent {
  const { random, sessionId, project } = input
  const agentId = `${sessionId.slice(0, 8)}${index}`
  const thread = createDemoThread({ at, model: input.model, baselineTokens: random.integer(16_000, 22_000), common: { sessionId, cwd: project.cwd, isSidechain: true, agentId } })
  recordUserPrompt(thread, 'Review the changes on this branch and report blocking issues.')
  const steps = random.integer(8, 22)
  for (let step = 0; step < steps; step += 1) {
    advance(thread, random.between(4, 20) * SECOND)
    const toolStep = nextToolStep(input)
    runToolStep(thread, { ...toolStep, isError: false }, random, `toolu_${agentId}_${step}`)
  }
  recordAssistantRequest(thread, { outputTokens: random.integer(1_200, 3_000), toolUse: null })
  return { agentId, records: thread.records, meta: { agentType: DEMO_AGENT.type, description: DEMO_AGENT.description } }
}

export function generateDemoSession(input: DemoSessionInput): DemoSession {
  const { random, project, sessionId } = input
  const startup = buildStartupContext(project, { includesLegacyServer: input.includesLegacyServer })
  const branch = random.pick(project.branches)
  const thread = createDemoThread({ at: input.startedAt, model: input.model, baselineTokens: startup.baselineTokens, common: { sessionId, cwd: project.cwd, gitBranch: branch, isSidechain: false } })
  const subagents: DemoSubagent[] = []
  pushRecord(thread, { type: 'custom-title', customTitle: random.pick(project.titles) })
  for (const record of startup.records) pushRecord(thread, record)
  const isLongSession = random.chance(0.3)
  const prompts = isLongSession ? random.integer(10, 20) : random.integer(2, 8)
  const usedSkills = USER_SKILLS.filter((skill) => random.chance(skill.usedProbability))
  const usesBrowser = random.chance(MCP_SERVERS.find((server) => server.name === 'browser-devtools')?.usedProbability ?? 0)
  const usesNotion = random.chance(0.03)
  let hasNestedInstructions = false
  let toolCounter = 0
  for (let prompt = 0; prompt < prompts; prompt += 1) {
    advance(thread, prompt === 0 ? 0 : random.chance(0.1) ? random.between(70, 200) * MINUTE : random.between(1, 9) * MINUTE)
    recordUserPrompt(thread, random.pick(PROMPTS))
    const steps = random.integer(2, isLongSession ? 12 : 8)
    for (let step = 0; step < steps; step += 1) {
      advance(thread, random.between(3, 30) * SECOND)
      const toolUseId = `toolu_${sessionId.slice(0, 8)}_${(toolCounter += 1)}`
      const toolStep = nextToolStep(input)
      runToolStep(thread, toolStep, random, toolUseId)
      if (!hasNestedInstructions && project.nestedInstructions && toolStep.name === 'Read' && random.chance(0.6)) {
        hasNestedInstructions = true
        const content = fillerText(project.nestedInstructions.chars)
        pushRecord(thread, { type: 'attachment', attachment: { type: 'nested_memory', path: project.nestedInstructions.path, content: { path: project.nestedInstructions.path, type: 'Project', content } } })
        addContextChars(thread, content.length)
      }
    }
    if (prompt === 0) {
      for (const skill of usedSkills) runToolStep(thread, { name: 'Skill', input: { skill: skill.name }, resultChars: 2_400, isError: false }, random, `toolu_${sessionId.slice(0, 8)}_skill_${skill.name}`)
    }
    if (usesBrowser && prompt === 1) {
      runToolStep(thread, { name: 'mcp__browser-devtools__take_screenshot', input: { url: 'http://localhost:3000' }, resultChars: 6_000, isError: false }, random, `toolu_${sessionId.slice(0, 8)}_browser`)
    }
    if (usesNotion && prompt === 0) {
      runToolStep(thread, { name: `mcp__${NOTION_CONNECTOR_ID}__notion-search`, input: { query: 'spec checkout' }, resultChars: 4_000, isError: false }, random, `toolu_${sessionId.slice(0, 8)}_notion`)
    }
    if (prompt === prompts - 1 && random.chance(0.35)) {
      const subagent = generateSubagent(input, thread.at, subagents.length)
      subagents.push(subagent)
      const toolUseId = `toolu_${sessionId.slice(0, 8)}_task_${subagents.length}`
      recordAssistantRequest(thread, { outputTokens: 300, toolUse: { id: toolUseId, name: 'Task', input: { description: DEMO_AGENT.description, subagent_type: DEMO_AGENT.type } } })
      advance(thread, random.between(3, 9) * MINUTE)
      recordToolResult(thread, { toolUseId, chars: random.integer(3_000, 7_000), isError: false })
    }
    recordAssistantRequest(thread, { outputTokens: random.integer(300, 1_200), toolUse: null })
    if (thread.contextTokens > COMPACTION_THRESHOLD_TOKENS && random.chance(0.5)) recordCompaction(thread, startup.baselineTokens + random.integer(10_000, 18_000))
  }
  return { records: thread.records, subagents }
}
