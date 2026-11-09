import { detectBaselineOverhead } from './detect-baseline-overhead.ts'
import { detectCacheRebuilds } from './detect-cache-rebuilds.ts'
import { detectContextBloat } from './detect-context-bloat.ts'
import { detectFailedToolCalls } from './detect-failed-tool-calls.ts'
import { detectLargeToolResults } from './detect-large-tool-results.ts'
import { detectRepeatedReads } from './detect-repeated-reads.ts'
import { detectSubagentSpend } from './detect-subagent-spend.ts'
import { detectUnusedMcpServers } from './detect-unused-mcp-servers.ts'
import { detectUnusedSkills } from './detect-unused-skills.ts'
import type { Detector } from './detector-context.ts'

export const allDetectors: Detector[] = [
  detectBaselineOverhead,
  detectUnusedMcpServers,
  detectUnusedSkills,
  detectCacheRebuilds,
  detectLargeToolResults,
  detectContextBloat,
  detectRepeatedReads,
  detectFailedToolCalls,
  detectSubagentSpend,
]
