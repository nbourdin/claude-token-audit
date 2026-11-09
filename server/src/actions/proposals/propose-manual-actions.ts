import { fixedContextCostUSD } from '../../analysis/detectors/detector-context.ts'
import { formatTokens } from '../../analysis/format.ts'
import { guessConnectorName } from '../../analysis/connector-name.ts'
import { mcpServerOf } from '../../analysis/tool-server-name.ts'
import type { ProposedAction } from '../action-types.ts'
import type { ProposalContext } from './proposal-context.ts'

const UUID_SERVER_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-/
const RARELY_USED_CALLS_PER_SESSION = 0.1
const LARGE_MEMORY_TOKENS = 3_000
const TRIM_SHARE = 0.5

function proposeConnectorDisables({ allSessions, recentMetrics, rates }: ProposalContext): ProposedAction[] {
  const usage = new Map<string, { toolNames: Set<string>; sessions: number; calls: number; monthlyCostUSD: number }>()
  for (const session of allSessions) {
    const loaded = new Set<string>()
    for (const item of [...session.toolDefinitions, ...session.deferredTools]) {
      const server = mcpServerOf(item.name)
      if (!server || !UUID_SERVER_PATTERN.test(server)) continue
      const entry = usage.get(server) ?? { toolNames: new Set(), sessions: 0, calls: 0, monthlyCostUSD: 0 }
      entry.toolNames.add(item.name)
      usage.set(server, entry)
      loaded.add(server)
    }
    for (const server of loaded) usage.get(server)!.sessions += 1
    for (const call of session.toolCalls) {
      const server = mcpServerOf(call.name)
      if (server && usage.has(server)) usage.get(server)!.calls += 1
    }
  }
  for (const metric of recentMetrics) {
    for (const [server, entry] of usage) {
      const chars = [...metric.session.toolDefinitions, ...metric.session.deferredTools].filter((item) => mcpServerOf(item.name) === server).reduce((total, item) => total + item.chars, 0)
      entry.monthlyCostUSD += fixedContextCostUSD(chars * metric.tokensPerSectionChar, metric, rates)
    }
  }
  return [...usage.entries()]
    .filter(([, entry]) => entry.sessions > 0 && entry.calls / entry.sessions < RARELY_USED_CALLS_PER_SESSION)
    .map(([server, entry]) => {
      const name = guessConnectorName([...entry.toolNames])
      return {
        key: `manual:connector:${server}`,
        findingId: 'unused-mcp-servers',
        title: `Couper le connecteur claude.ai « ${name} »`,
        rationale: `${entry.calls} appel${entry.calls > 1 ? 's' : ''} sur ${entry.sessions} sessions où il était chargé.`,
        changes: [{ target: 'claude.ai → Paramètres → Connecteurs', description: `désactive « ${name} » (id ${server.slice(0, 8)}…), ou par session dans le menu des connecteurs` }],
        estimatedMonthlySavingUSD: entry.monthlyCostUSD,
        project: null,
        caveat: 'Les connecteurs claude.ai sont injectés par l’app : aucun fichier local ne les contrôle. Marque l’action comme faite pour suivre l’effet.',
        payload: { kind: 'manual', instructions: `Désactive le connecteur ${name} dans claude.ai (Paramètres → Connecteurs). Tu pourras le réactiver le jour où tu en as besoin.`, prompt: null },
      }
    })
}

function proposeMemoryTrims({ recentMetrics, rates }: ProposalContext): ProposedAction[] {
  const memoryFiles = new Map<string, { tokens: number; sessions: number; monthlyCostUSD: number }>()
  for (const metric of recentMetrics) {
    for (const section of metric.session.contextSections) {
      if (section.kind !== 'memory' || !section.label.startsWith('MEMORY.md')) continue
      const tokens = section.chars * metric.tokensPerSectionChar
      const entry = memoryFiles.get(section.label) ?? { tokens: 0, sessions: 0, monthlyCostUSD: 0 }
      entry.tokens += tokens
      entry.sessions += 1
      entry.monthlyCostUSD += fixedContextCostUSD(tokens, metric, rates)
      memoryFiles.set(section.label, entry)
    }
  }
  return [...memoryFiles.entries()]
    .filter(([, entry]) => entry.tokens / entry.sessions >= LARGE_MEMORY_TOKENS)
    .map(([label, entry]) => {
      const averageTokens = entry.tokens / entry.sessions
      return {
        key: `manual:memory:${label}`,
        findingId: 'baseline-overhead',
        title: `Élaguer ${label}`,
        rationale: `L’index mémoire pèse ~${formatTokens(averageTokens)} tokens et il est chargé dans chaque session (${entry.sessions} sessions ces 30 derniers jours).`,
        changes: [{ target: label, description: 'à faire dans Claude Code avec le prompt fourni (skill memory-audit si disponible)' }],
        estimatedMonthlySavingUSD: entry.monthlyCostUSD * TRIM_SHARE,
        project: null,
        caveat: null,
        payload: {
          kind: 'manual',
          instructions: 'Lance ce prompt dans une session Claude Code du projet, relis le diff, puis marque l’action comme faite.',
          prompt: `Élague l'index MEMORY.md de ce projet : il fait ~${formatTokens(averageTokens)} tokens et il est chargé dans chaque session. Cible : moins de ${formatTokens(averageTokens * TRIM_SHARE)} tokens. Une ligne courte par entrée (titre + crochet de 10 mots max), fusionne les doublons, supprime les entrées périmées ou qui décrivent un état plutôt qu'une décision, et garde le détail dans les fichiers liés. Montre-moi la liste des entrées supprimées ou fusionnées avant d'écrire.`,
        },
      }
    })
}

function proposeQuietCommands({ recentReport }: ProposalContext): ProposedAction[] {
  const finding = recentReport.findings.find((candidate) => candidate.id === 'large-tool-results')
  const bashEvidence = finding?.evidence.filter((item) => item.label.startsWith('Bash:')) ?? []
  if (!finding || bashEvidence.length === 0) return []
  const commandFamilies = bashEvidence.slice(0, 5).map((item) => item.label.replace('Bash: ', ''))
  return [
    {
      key: 'manual:quiet-commands',
      findingId: 'large-tool-results',
      title: 'Apprendre à Claude à filtrer la sortie des commandes',
      rationale: `Les sorties Bash volumineuses restent dans le contexte et sont relues à chaque requête. Familles en cause : ${commandFamilies.join(', ')}.`,
      changes: [{ target: 'CLAUDE.md de tes projets (ou ~/.claude/CLAUDE.md)', description: 'ajoute une règle de sortie courte, via le prompt fourni' }],
      estimatedMonthlySavingUSD: bashEvidence.reduce((total, item) => total + Number(item.detail?.replace(/[^0-9.]/g, '') || 0), 0) * TRIM_SHARE,
      project: null,
      caveat: null,
      payload: {
        kind: 'manual',
        instructions: 'Lance ce prompt dans Claude Code, relis le diff, puis marque l’action comme faite.',
        prompt: `Ajoute dans ~/.claude/CLAUDE.md une règle courte : « Sorties de commandes : limite ce qui entre dans le contexte. Tests, typecheck, build, lint et logs passent par un filtre (| tail -40, grep -E "error|FAIL|✗", --reporter=dot, --silent). Ne cat jamais un fichier de plus de 300 lignes : Grep puis Read avec offset/limit. » Familles de commandes les plus coûteuses chez moi : ${commandFamilies.join(', ')}. Adapte les exemples de filtre à ces commandes.`,
      },
    },
  ]
}

export function proposeManualActions(context: ProposalContext): ProposedAction[] {
  return [...proposeConnectorDisables(context), ...proposeMemoryTrims(context), ...proposeQuietCommands(context)]
}
