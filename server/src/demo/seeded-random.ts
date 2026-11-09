export type SeededRandom = {
  next: () => number
  between: (min: number, max: number) => number
  integer: (min: number, max: number) => number
  chance: (probability: number) => boolean
  pick: <Item>(items: readonly Item[]) => Item
}

export function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296
  }
  const between = (min: number, max: number) => min + next() * (max - min)
  const integer = (min: number, max: number) => Math.floor(between(min, max + 1))
  return {
    next,
    between,
    integer,
    chance: (probability) => next() < probability,
    pick: (items) => items[Math.floor(next() * items.length)]!,
  }
}
