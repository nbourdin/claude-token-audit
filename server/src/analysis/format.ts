export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`
  return `${Math.round(tokens)}`
}

export function formatUSD(amount: number): string {
  if (amount >= 100) return `$${amount.toFixed(0)}`
  if (amount >= 1) return `$${amount.toFixed(2)}`
  return `$${amount.toFixed(3)}`
}

export function formatPercent(share: number): string {
  return `${(share * 100).toFixed(share < 0.1 ? 1 : 0)} %`
}

export function sum<T>(items: T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0)
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>()
  for (const item of items) {
    const groupKey = key(item)
    const group = groups.get(groupKey)
    if (group) group.push(item)
    else groups.set(groupKey, [item])
  }
  return groups
}
