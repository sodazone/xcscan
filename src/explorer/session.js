const FILTERS_STORAGE_KEY = 'journeys-filters'

export function saveFiltersToSession(
  filters,
  storageKey = FILTERS_STORAGE_KEY
) {
  try {
    const { currentSearchTerm, ...rest } = filters
    sessionStorage.setItem(storageKey, JSON.stringify(rest))
  } catch {
    // ignore sessionStorage errors (e.g. private mode)
  }
}

export function loadFiltersFromSession(storageKey = FILTERS_STORAGE_KEY) {
  try {
    const stored = sessionStorage.getItem(storageKey)
    if (!stored) {
      return null
    }
    return JSON.parse(stored)
  } catch {
    return null
  }
}
