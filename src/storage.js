const DECK_KEY = 'swipe-app:deck'
const PILES_KEY = 'swipe-app:piles'
const SCREEN_KEY = 'swipe-app:screen'

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
  return localStorage.getItem(SCREEN_KEY) || 'upload'
}

export function saveScreen(s) {
  localStorage.setItem(SCREEN_KEY, s)
}

export function clearAll() {
  localStorage.removeItem(DECK_KEY)
  localStorage.removeItem(PILES_KEY)
  localStorage.removeItem(SCREEN_KEY)
}
