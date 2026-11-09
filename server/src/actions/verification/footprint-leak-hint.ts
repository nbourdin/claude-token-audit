import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { SessionMetrics } from '../../analysis/session-metrics.ts'
import { config } from '../../config.ts'
import { asRecord } from '../../transcripts/json-access.ts'
import { resolveRepositoryRoot } from '../../transcripts/resolve-project.ts'
import type { ContextFootprint } from '../action-types.ts'
import { readJsonRecord } from '../json-file.ts'

const UUID_SERVER_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-/

function displayPath(path: string): string {
  return path.replace(homedir(), '~')
}

function repositoryRootsOf(affected: SessionMetrics[]): string[] {
  return [...new Set(affected.map((metric) => resolveRepositoryRoot(metric.session.cwd)).filter((root) => root !== null))]
}

function mcpServerLeaks(serverName: string, affected: SessionMetrics[]): string[] {
  if (UUID_SERVER_PATTERN.test(serverName)) return ['c’est un connecteur claude.ai : il se coupe dans claude.ai → Paramètres → Connecteurs']
  const claudeJson = readJsonRecord(config.claudeJsonPath)
  const leaks: string[] = []
  if (serverName in (asRecord(claudeJson['mcpServers']) ?? {})) leaks.push('il a été remis dans ~/.claude.json → mcpServers')
  for (const [projectPath, projectConfig] of Object.entries(asRecord(claudeJson['projects']) ?? {})) {
    if (serverName in (asRecord(asRecord(projectConfig)?.['mcpServers']) ?? {})) leaks.push(`il est aussi déclaré pour ${displayPath(projectPath)} dans ~/.claude.json`)
  }
  for (const root of repositoryRootsOf(affected)) {
    const projectMcpPath = join(root, '.mcp.json')
    if (existsSync(projectMcpPath) && serverName in (asRecord(readJsonRecord(projectMcpPath)['mcpServers']) ?? {})) leaks.push(`il est déclaré dans ${displayPath(projectMcpPath)}`)
  }
  return leaks
}

function pluginLeaks(pluginName: string, affected: SessionMetrics[]): string[] {
  const settingsPaths = [config.claudeSettingsPath, ...repositoryRootsOf(affected).flatMap((root) => [join(root, '.claude', 'settings.json'), join(root, '.claude', 'settings.local.json')])]
  return settingsPaths
    .filter((path) => existsSync(path))
    .filter((path) => Object.entries(asRecord(readJsonRecord(path)['enabledPlugins']) ?? {}).some(([pluginId, isEnabled]) => pluginId.startsWith(`${pluginName}@`) && isEnabled === true))
    .map((path) => `il est activé dans ${displayPath(path)}`)
}

function skillLeaks(skillNames: string[]): string[] {
  const restored = skillNames.filter((name) => existsSync(join(config.claudeSkillsDirectory, name)))
  if (restored.length > 0) return [`${restored.join(', ')} ${restored.length > 1 ? 'sont revenus' : 'est revenu'} dans ~/.claude/skills`]
  return ['un skill du même nom est fourni ailleurs (dossier .claude/skills d’un projet ou plugin)']
}

export function footprintLeakHint(footprint: ContextFootprint, affected: SessionMetrics[]): string | null {
  const leaks =
    footprint.kind === 'mcp-server'
      ? mcpServerLeaks(footprint.serverName, affected)
      : footprint.kind === 'plugin'
        ? pluginLeaks(footprint.pluginName, affected)
        : footprint.kind === 'skills'
          ? skillLeaks(footprint.skillNames)
          : []
  return leaks.length > 0 ? leaks.join(' ; ') : null
}
