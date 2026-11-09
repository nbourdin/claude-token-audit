import { mcpToolSuffix } from './tool-server-name.ts'

const KNOWN_CONNECTORS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /figma|code_connect|design_system/i, name: 'Figma' },
  { pattern: /notion/i, name: 'Notion' },
  { pattern: /stripe/i, name: 'Stripe' },
  { pattern: /spreadsheet|sheet/i, name: 'Google Sheets' },
  { pattern: /shared_drive|drive|file_permissions/i, name: 'Google Drive' },
  { pattern: /aws/i, name: 'AWS' },
  { pattern: /playlist|currently_playing/i, name: 'Spotify' },
  { pattern: /get_trace|list_issues|uptime|status_incident/i, name: 'Monocle' },
  { pattern: /^(batch|guide|update|create)$/i, name: 'Claude Docs' },
]

export function guessConnectorName(toolNames: string[]): string {
  const suffixes = toolNames.map(mcpToolSuffix)
  return KNOWN_CONNECTORS.find(({ pattern }) => suffixes.some((suffix) => pattern.test(suffix)))?.name ?? suffixes[0] ?? 'inconnu'
}
