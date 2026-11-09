import { config } from '../../config.ts'
import type { ProposedAction } from '../action-types.ts'
import { CONTEXT_GUARD_EVENT, isContextGuardInstalled } from '../context-guard-hook-entry.ts'
import { readJsonRecord } from '../json-file.ts'
import type { ProposalContext } from './proposal-context.ts'

const CONTEXT_THRESHOLD_TOKENS = 150_000
const IDLE_MINUTES = 60
const ASSUMED_FOLLOW_RATE = 0.3

export function proposeContextGuard({ recentReport, rates, recentMetrics }: ProposalContext): ProposedAction[] {
  if (isContextGuardInstalled(readJsonRecord(config.claudeSettingsPath))) return []
  const impactOf = (findingId: string) => recentReport.findings.find((finding) => finding.id === findingId)?.impactUSD ?? 0
  const mainModel = recentMetrics[0]?.mainModel ?? 'claude-opus'
  return [
    {
      key: 'context-guard',
      findingId: 'context-bloat',
      title: 'Installer le garde-fou de contexte',
      rationale: `Un hook te prévient au moment d’envoyer un message quand le contexte dépasse ${CONTEXT_THRESHOLD_TOKENS / 1000}k tokens (puis tous les 100k), ou quand tu reprends une session après plus de ${IDLE_MINUTES} min (cache expiré, tout est réécrit). Il ne bloque rien.`,
      changes: [
        {
          target: '~/.claude/settings.json → hooks.' + CONTEXT_GUARD_EVENT,
          description: `ajoute la commande \`node server/src/hooks/context-guard.ts\` (60 ms, lecture seule du transcript)`,
        },
      ],
      estimatedMonthlySavingUSD: (impactOf('context-bloat') + impactOf('cache-rebuilds')) * ASSUMED_FOLLOW_RATE,
      project: null,
      caveat: 'Estimation si tu suis environ une alerte sur trois. Le hook pointe vers ce dépôt : si tu le déplaces, annule puis réinstalle.',
      payload: {
        kind: 'context-guard-hook',
        contextThresholdTokens: CONTEXT_THRESHOLD_TOKENS,
        idleMinutes: IDLE_MINUTES,
        inputPricePerMillion: rates.inputPriceFor(mainModel) * 1_000_000,
      },
      verification: { kind: 'context-guard-hook' },
    },
  ]
}
