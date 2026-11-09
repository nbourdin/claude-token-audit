import { formatUSD, groupBy, sum } from '../format.ts'
import type { Finding } from '../report-types.ts'
import type { Detector } from './detector-context.ts'
import { severityFor } from './detector-context.ts'

const REPEATED_READ_THRESHOLD = 3
const IMAGE_FILE_PATTERN = /\.(png|jpe?g|gif|webp)$/i

export const detectRepeatedReads: Detector = ({ metrics, totalCostUSD }) => {
  const repeated = metrics.flatMap((metric) => {
    const reads = metric.toolCalls.filter((toolCall) => toolCall.name === 'Read' && toolCall.target && !IMAGE_FILE_PATTERN.test(toolCall.target))
    return [...groupBy(reads, (toolCall) => toolCall.target).entries()]
      .filter(([, calls]) => calls.length >= REPEATED_READ_THRESHOLD)
      .map(([filePath, calls]) => {
        const sorted = [...calls].sort((left, right) => left.at - right.at)
        return { filePath, count: calls.length, wastedUSD: sum(sorted.slice(1), (toolCall) => toolCall.costUSD), metric }
      })
  })
  if (repeated.length === 0) return null
  const impactUSD = sum(repeated, (item) => item.wastedUSD)
  const ranked = [...repeated].sort((left, right) => right.wastedUSD - left.wastedUSD)
  return {
    id: 'repeated-reads',
    title: 'Mêmes fichiers relus plusieurs fois dans une session',
    severity: severityFor(impactUSD, totalCostUSD),
    impactUSD,
    impactTokens: 0,
    summary: `${repeated.length} fichiers ont été lus ${REPEATED_READ_THRESHOLD} fois ou plus dans la même session. Chaque relecture rajoute une copie complète dans le contexte : ${formatUSD(impactUSD)}.`,
    recommendations: [
      'Relecture après édition : inutile, l’outil Edit confirme déjà la modification.',
      'Boucles essai-erreur sur un fichier : décris le changement complet en une fois, ou demande une réécriture complète du fichier.',
    ],
    evidence: ranked.slice(0, 10).map((item) => ({
      label: item.filePath.split('/').slice(-3).join('/'),
      value: `${item.count} lectures`,
      detail: `${formatUSD(item.wastedUSD)} · ${item.metric.session.title}`,
      sessionId: item.metric.session.sessionId,
    })),
  } satisfies Finding
}
