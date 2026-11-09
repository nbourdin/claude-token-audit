import { buildContextFiles } from '../build-context-files.ts'
import { formatTokens, formatUSD, sum } from '../format.ts'
import type { Finding } from '../report-types.ts'
import type { Detector } from './detector-context.ts'
import { severityFor } from './detector-context.ts'

export const detectOversizedContextFiles: Detector = ({ metrics, rates, totalCostUSD }) => {
  const oversized = buildContextFiles(metrics, rates).filter((file) => file.isOversized)
  if (oversized.length === 0) return null
  const impactUSD = sum(oversized, (file) => file.excessCostUSD)
  return {
    id: 'oversized-context-files',
    title: 'Fichiers d’instructions et de mémoire trop lourds',
    severity: severityFor(impactUSD, totalCostUSD),
    impactUSD,
    impactTokens: sum(oversized, (file) => file.averageTokens - file.thresholdTokens),
    summary: `${oversized.length} fichier${oversized.length > 1 ? 's' : ''} CLAUDE.md, MEMORY.md ou note mémoire dépassent leur taille cible. Ils coûtent ${formatUSD(sum(oversized, (file) => file.costUSD))} sur la période, dont ${formatUSD(impactUSD)} pour la part au-dessus du seuil.`,
    recommendations: [
      'MEMORY.md est un index : une ligne courte par entrée, le détail dans les fichiers liés (cible < 3k tokens).',
      'CLAUDE.md : garde les règles qui changent le comportement ; déplace les références (tables, procédures) dans des fichiers lus à la demande (cible < 4k tokens).',
      'Notes mémoire : une décision par fichier, sans historique ni état du moment (cible < 1,5k tokens).',
    ],
    evidence: oversized.slice(0, 10).map((file) => ({
      label: file.path,
      value: formatUSD(file.costUSD),
      detail: `~${formatTokens(file.averageTokens)} tokens (cible ${formatTokens(file.thresholdTokens)}) · ${file.loads} chargement${file.loads > 1 ? 's' : ''}`,
    })),
  } satisfies Finding
}
