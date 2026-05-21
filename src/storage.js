const DECK_KEY = 'swipe-app:deck'
const PILES_KEY = 'swipe-app:piles'
const SCREEN_KEY = 'swipe-app:screen'
const SOURCE_KEY = 'swipe-app:source'
const LISTS_KEY = 'swipe-app:lists'
const LAST_FETCH_KEY = 'swipe-app:lastFetch'
const DISTRACTION_KEY = 'swipe-app:distraction'

const EMPTY_PILES = { engage: [], skip: [], blocked: [], drop: [] }

export function loadDeck() {
  try {
    return JSON.parse(localStorage.getItem(DECK_KEY)) || []
  } catch {
    return []
  }
}

export function saveDeck(deck) {
  localStorage.setItem(DECK_KEY, JSON.stringify(deck))
}

export function loadPiles() {
  try {
    return { ...EMPTY_PILES, ...(JSON.parse(localStorage.getItem(PILES_KEY)) || {}) }
  } catch {
    return { ...EMPTY_PILES }
  }
}

export function savePiles(piles) {
  localStorage.setItem(PILES_KEY, JSON.stringify(piles))
}

export function loadScreen() {
  return localStorage.getItem(SCREEN_KEY) || 'load'
}

export function saveScreen(s) {
  localStorage.setItem(SCREEN_KEY, s)
}

export function loadSource() {
  return localStorage.getItem(SOURCE_KEY) || 'queue'
}

export function saveSource(source) {
  localStorage.setItem(SOURCE_KEY, source)
}

export function loadLists() {
  try {
    return JSON.parse(localStorage.getItem(LISTS_KEY)) || []
  } catch {
    return []
  }
}

export function saveLists(lists) {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists))
}

export function loadLastFetch() {
  const v = localStorage.getItem(LAST_FETCH_KEY)
  return v ? Number(v) : 0
}

export function saveLastFetch(ts) {
  localStorage.setItem(LAST_FETCH_KEY, String(ts))
}

export function loadDistraction() {
  try {
    return JSON.parse(localStorage.getItem(DISTRACTION_KEY)) || {}
  } catch {
    return {}
  }
}

export function saveDistraction(data) {
  localStorage.setItem(DISTRACTION_KEY, JSON.stringify(data))
}

export function recordDistractionEvent(uid, label, outcome) {
  const all = loadDistraction()
  const entry = all[uid] || { label, events: [] }
  entry.label = label
  entry.events.push({ outcome, at: new Date().toISOString() })
  all[uid] = entry
  saveDistraction(all)
}

export function clearAll() {
  localStorage.removeItem(DECK_KEY)
  localStorage.removeItem(PILES_KEY)
  localStorage.removeItem(SCREEN_KEY)
  localStorage.removeItem(SOURCE_KEY)
  localStorage.removeItem(LISTS_KEY)
  localStorage.removeItem(LAST_FETCH_KEY)
  localStorage.removeItem(DISTRACTION_KEY)
}
