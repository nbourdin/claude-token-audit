export function formatUSD(amount: number): string {
  if (amount === 0) return '$0'
  if (amount >= 100) return `$${Math.round(amount).toLocaleString('fr-FR')}`
  if (amount >= 1) return `$${amount.toFixed(2)}`
  return `$${amount.toFixed(3)}`
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000_000) return `${(tokens / 1_000_000_000).toFixed(1)} Md`
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(tokens >= 100_000 ? 0 : 1)}k`
  return `${Math.round(tokens)}`
}

export function formatPercent(share: number): string {
  return `${(share * 100).toFixed(share < 0.1 ? 1 : 0)} %`
}

export function formatDay(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`
  if (minutes < 60 * 24) return `${(minutes / 60).toFixed(1)} h`
  return `${(minutes / 60 / 24).toFixed(1)} j`
}
