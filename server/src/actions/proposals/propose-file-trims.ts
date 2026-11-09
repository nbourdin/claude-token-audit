import { buildContextFiles } from '../../analysis/build-context-files.ts'
import { formatTokens, formatUSD } from '../../analysis/format.ts'
import type { ContextFileAggregate } from '../../analysis/report-types.ts'
import type { ProposedAction } from '../action-types.ts'
import type { ProposalContext } from './proposal-context.ts'

const MINIMUM_MONTHLY_SAVING_USD = 1

const ORIGIN_LABELS: Record<ContextFileAggregate['origins'][number], string> = {
  startup: 'chargé au démarrage',
  nested: 'ajouté quand Claude entre dans le dossier',
  read: 'lu par Claude',
}

function trimPrompt(file: ContextFileAggregate): string {
  const size = `il fait ~${formatTokens(file.averageTokens)} tokens et il a été chargé ${file.loads} fois en 30 jours. Cible : moins de ${formatTokens(file.thresholdTokens)} tokens.`
  const review = 'Montre-moi ce que tu supprimes, fusionnes ou déplaces avant d’écrire.'
  switch (file.category) {
    case 'memory-index':
      return `Élague l'index mémoire ${file.filePath} : ${size} Une ligne courte par entrée (titre + crochet de 10 mots max), fusionne les doublons, supprime les entrées périmées ou qui décrivent un état plutôt qu'une décision, et garde le détail dans les fichiers liés. ${review}`
    case 'memory-note':
      return `Condense la note mémoire ${file.filePath} : ${size} Garde la décision, le pourquoi et comment l'appliquer ; supprime l'historique, l'état du moment et ce qui est déductible du code. ${review}`
    case 'instructions':
      return `Allège ${file.filePath} : ${size} Garde les règles qui changent ton comportement et les pièges non évidents. Déplace les références longues (tables, procédures pas à pas, exemples) dans des docs lus à la demande, avec un lien d'une ligne qui dit quand les lire. Supprime ce qui est déductible du code ou déjà dit dans un CLAUDE.md parent. ${review}`
    case 'claude-config':
      return `Allège ${file.filePath} : ${size} Garde ce qui guide l'exécution ; déplace exemples et références dans des fichiers séparés lus seulement quand ils servent. ${review}`
  }
}

function caveatFor(file: ContextFileAggregate): string | null {
  if (file.category === 'memory-index' || file.category === 'memory-note') return null
  if (file.filePath.startsWith('~/.claude/')) return 'Relis le diff : le fichier sert à toutes tes sessions.'
  return 'Fichier versionné : relis le diff et commite-le. L’effet se vérifie une fois la modification sur la branche où tu travailles.'
}

export function proposeFileTrims({ recentMetrics, rates }: ProposalContext): ProposedAction[] {
  return buildContextFiles(recentMetrics, rates)
    .filter((file) => file.isOversized && file.excessCostUSD >= MINIMUM_MONTHLY_SAVING_USD)
    .map((file) => ({
      key: `manual:trim-file:${file.path}`,
      findingId: 'oversized-context-files',
      title: `Alléger ${file.path}`,
      rationale: `~${formatTokens(file.averageTokens)} tokens pour une cible de ${formatTokens(file.thresholdTokens)}, ${file.origins.map((origin) => ORIGIN_LABELS[origin]).join(' ou ')} : ${file.loads} chargements dans ${file.sessions} sessions ces 30 derniers jours, ${formatUSD(file.costUSD)}.`,
      changes: [{ target: file.filePath, description: 'à faire dans Claude Code avec le prompt fourni' }],
      estimatedMonthlySavingUSD: file.excessCostUSD,
      project: null,
      caveat: caveatFor(file),
      payload: {
        kind: 'manual',
        instructions: 'Lance ce prompt dans une session Claude Code du projet, relis le diff, puis marque l’action comme faite.',
        prompt: trimPrompt(file),
      },
      verification: { kind: 'context-file', path: file.path, thresholdTokens: file.thresholdTokens },
    }))
}
