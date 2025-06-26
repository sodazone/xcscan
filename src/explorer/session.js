const FILTERS_STORAGE_KEY = 'journeys-filters'

export function saveFiltersToSession(filters) {
  try {
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
  } catch {
    // ignore sessionStorage errors (e.g. private mode)
  }
}

export function loadFiltersFromSession() {
  try {
    const stored = sessionStorage.getItem(FILTERS_STORAGE_KEY)
    if (!stored) {
      return null
    }
    return JSON.parse(stored)
  } catch {
    return null
  }
}
