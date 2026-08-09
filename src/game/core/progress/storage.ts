const STORAGE_KEY = 'mad-progress'

export function getHighestCompletedIndex(): number {
  if (typeof window === 'undefined') return -1
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) return -1
  const value = Number(raw)
  return Number.isInteger(value) && value >= 0 ? value : -1
}

// ponytail: max() keeps replays idempotent — beating phase 1 twice never skips to phase 3
export function completePhase(index: number): void {
  if (typeof window === 'undefined') return
  if (index > getHighestCompletedIndex()) {
    window.localStorage.setItem(STORAGE_KEY, String(index))
  }
}

export function isUnlocked(index: number): boolean {
  return index <= getHighestCompletedIndex() + 1
}
