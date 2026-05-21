import { useState } from 'react'
import { saveDeck } from './storage.js'

function makeCards(text) {
  const items = text.split('\n').map((l) => l.trim()).filter(Boolean)
  return items.map((label, i) => ({
    id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    label,
  }))
}

export default function Upload({ deck, setDeck, setScreen }) {
  const [text, setText] = useState('')

  function buildDeck() {
    const cards = makeCards(text)
    if (cards.length === 0) return
    setDeck(cards)
    saveDeck(cards)
    setText('')
    setScreen('swipe')
  }

  function appendToDeck() {
    const cards = makeCards(text)
    if (cards.length === 0) return
    const merged = [...deck, ...cards]
    setDeck(merged)
    saveDeck(merged)
    setText('')
    setScreen('swipe')
  }

  const hasText = text.trim().length > 0
  const hasDeck = deck.length > 0

  return (
    <div className="upload">
      <h1>Build deck</h1>
      <p className="hint">Paste your reminders — one per line.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          'Email Joe design notes\n' +
          'Review videographer options\n' +
          'Pick wedding invitation wording\n' +
          'Schedule may facial\n' +
          'Apply to METR\n' +
          '...'
        }
        rows={12}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />
      <div className="actions">
        <button className="primary" onClick={buildDeck} disabled={!hasText}>
          {hasDeck ? `Replace deck (${deck.length} → new)` : 'Build deck'}
        </button>
        {hasDeck && (
          <button className="secondary" onClick={appendToDeck} disabled={!hasText}>
            Append to existing deck
          </button>
        )}
      </div>
      {hasDeck && (
        <p className="status">{deck.length} card{deck.length === 1 ? '' : 's'} waiting to swipe</p>
      )}
    </div>
  )
}
