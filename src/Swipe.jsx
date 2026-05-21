import { useState, useRef } from 'react'
import TinderCard from 'react-tinder-card'
import { saveDeck, savePiles, recordDistractionEvent } from './storage.js'
import { postNote, createReminder } from './api.js'
import Timer from './Timer.jsx'

const DIRECTION_TO_PILE = {
  right: 'engage',
  left: 'skip',
  up: 'blocked',
  down: 'drop',
}

const PILE_LABEL = {
  engage: 'Engage',
  skip: 'Skip',
  blocked: 'Blocked',
  drop: 'Drop',
}

const URL_REGEX = /(https?:\/\/\S+)/i

function findUrl(card) {
  const fields = [card.label, card.description].filter(Boolean)
  for (const f of fields) {
    const m = f.match(URL_REGEX)
    if (m) return m[1]
  }
  return null
}

function nativeReminderLink() {
  return 'x-apple-reminderkit://'
}

export default function Swipe({ deck, setDeck, piles, setPiles, setScreen }) {
  const [lastAction, setLastAction] = useState(null)
  const [tappedCard, setTappedCard] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [mode, setMode] = useState('idle')
  const [readyCard, setReadyCard] = useState(null)
  const [pendingLeave, setPendingLeave] = useState(null)
  const [syncErrors, setSyncErrors] = useState({})
  const childRefs = useRef({})

  function fileCard(card, direction, opts = {}) {
    const pileKey = DIRECTION_TO_PILE[direction] || opts.pileOverride
    if (!pileKey) return
    const enriched = opts.note
      ? { ...card, comment: opts.note, notedAt: new Date().toISOString() }
      : card
    const newPiles = { ...piles, [pileKey]: [...piles[pileKey], enriched] }
    setPiles(newPiles)
    savePiles(newPiles)
    const newDeck = deck.filter((c) => c.id !== card.id)
    setDeck(newDeck)
    saveDeck(newDeck)
    setLastAction({ card: enriched, pileKey })

    if (opts.note && card.uid && card.list) {
      postNote({ uid: card.uid, note: opts.note, listName: card.list })
        .catch((err) => {
          console.error('Note sync failed:', err)
          setSyncErrors((e) => ({ ...e, [card.id]: err.message }))
        })
    }
  }

  function openNote(card) {
    setTappedCard(card)
    setNoteText('')
    setMode('note')
  }

  function closeNote() {
    setTappedCard(null)
    setNoteText('')
    setMode('idle')
  }

  function commitNoteWithOutcome(direction) {
    if (!tappedCard) return
    const note = noteText.trim()
    fileCard(tappedCard, direction, { note: note || undefined })
    closeNote()
  }

  async function commitNeedsBreakdown() {
    if (!tappedCard) return
    const note = noteText.trim()
    const card = tappedCard

    fileCard(card, null, {
      pileOverride: 'blocked',
      note: note || 'Needs breakdown',
    })
    closeNote()

    try {
      await createReminder({
        summary: `🤖 break down: ${card.label}`,
        listName: card.list,
        description: note ? `Bridge task for: ${card.label}\n\nNote: ${note}` : `Bridge task for: ${card.label}`,
        parentUid: card.uid,
      })
    } catch (err) {
      console.error('Child reminder create failed:', err)
      setSyncErrors((e) => ({ ...e, [card.id]: `Child create: ${err.message}` }))
    }
  }

  function openReady(card) {
    setReadyCard(card)
    const url = findUrl(card)
    setMode(url ? 'ready-url' : 'timer')
  }

  function confirmLeaveForUrl(url) {
    if (!readyCard) return
    setPendingLeave({ card: readyCard, url, at: Date.now() })
    window.open(url, '_blank', 'noopener,noreferrer')
    setMode('post-url')
  }

  function recordOutcome(outcome) {
    if (!pendingLeave) return
    recordDistractionEvent(pendingLeave.card.uid || pendingLeave.card.id, pendingLeave.card.label, outcome)
    setPendingLeave(null)
    setReadyCard(null)
    setMode('idle')
  }

  function closeReady() {
    setReadyCard(null)
    setMode('idle')
    setPendingLeave(null)
  }

  if (deck.length === 0) {
    return (
      <div className="swipe empty">
        <h2>Deck is empty.</h2>
        <p>Load more reminders or review what you've sorted.</p>
        <div className="actions">
          <button onClick={() => setScreen('load')}>Load more</button>
          <button onClick={() => setScreen('piles')}>Review piles</button>
        </div>
      </div>
    )
  }

  const stackForDisplay = [...deck].reverse()
  const topCard = deck[0]

  async function triggerSwipe(direction) {
    const ref = childRefs.current[topCard.id]
    if (ref && ref.swipe) {
      await ref.swipe(direction)
    } else {
      fileCard(topCard, direction)
    }
  }

  return (
    <div className="swipe">
      <div className="legend">
        <span className="up">↑ Blocked</span>
        <span className="left">← Skip</span>
        <span className="right">Engage →</span>
        <span className="down">↓ Drop</span>
      </div>
      <div className="card-stack">
        {stackForDisplay.map((card) => {
          const url = findUrl(card)
          return (
            <TinderCard
              key={card.id}
              ref={(el) => { childRefs.current[card.id] = el }}
              className="swipe-card-wrap"
              preventSwipe={[]}
              onSwipe={(dir) => fileCard(card, dir)}
              swipeRequirementType="position"
              swipeThreshold={80}
            >
              <div className="swipe-card" onClick={(e) => {
                if (card.id !== topCard.id) return
                e.stopPropagation()
                openNote(card)
              }}>
                <a
                  className="card-corner"
                  href={nativeReminderLink()}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Open in Reminders app"
                >
                  ↗
                </a>
                {card.list && <div className="card-list">{card.list}</div>}
                <div className="card-body">{card.label}</div>
                {card.description && (
                  <div className="card-desc">{card.description}</div>
                )}
                {url && <div className="card-url-hint">↗ link</div>}
                <div className="card-tap-hint">tap to add note · drag to swipe</div>
              </div>
            </TinderCard>
          )
        })}
      </div>

      <div className="button-bar">
        <button className="btn-skip" onClick={() => triggerSwipe('left')} aria-label="Skip">←</button>
        <button className="btn-drop" onClick={() => triggerSwipe('down')} aria-label="Drop">↓</button>
        <button className="btn-blocked" onClick={() => triggerSwipe('up')} aria-label="Blocked">↑</button>
        <button className="btn-engage" onClick={() => triggerSwipe('right')} aria-label="Engage">→</button>
      </div>

      <button
        className="ready-btn"
        onClick={() => openReady(topCard)}
      >
        Ready for it! →
      </button>

      <div className="counter">{deck.length} left</div>
      {lastAction && (
        <div className={`last ${lastAction.pileKey}`}>
          Last → {PILE_LABEL[lastAction.pileKey]}: {lastAction.card.label}
        </div>
      )}

      {mode === 'note' && tappedCard && (
        <div className="overlay" onClick={closeNote}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="note-task">{tappedCard.label}</div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Quick note before deciding…"
              rows={4}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <div className="note-outcomes">
              <button className="out engage" onClick={() => commitNoteWithOutcome('right')}>→ Engage</button>
              <button className="out skip" onClick={() => commitNoteWithOutcome('left')}>← Skip</button>
              <button className="out blocked" onClick={() => commitNoteWithOutcome('up')}>↑ Block</button>
              <button className="out drop" onClick={() => commitNoteWithOutcome('down')}>↓ Drop</button>
            </div>
            <button className="out breakdown" onClick={commitNeedsBreakdown}>
              ⚠ Needs breakdown → child reminder
            </button>
            <button className="cancel" onClick={closeNote}>Cancel</button>
          </div>
        </div>
      )}

      {mode === 'ready-url' && readyCard && (
        <div className="overlay" onClick={closeReady}>
          <div className="ready-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ready-task">{readyCard.label}</div>
            <p className="ready-prompt">Leave app to take in this content?</p>
            <div className="ready-actions">
              <button className="primary" onClick={() => confirmLeaveForUrl(findUrl(readyCard))}>
                Yes, open ↗
              </button>
              <button className="ghost" onClick={() => { setMode('timer') }}>
                No — start a timer instead
              </button>
              <button className="cancel" onClick={closeReady}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {mode === 'timer' && readyCard && (
        <Timer card={readyCard} onClose={closeReady} />
      )}

      {mode === 'post-url' && pendingLeave && (
        <div className="overlay">
          <div className="ready-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ready-task">{pendingLeave.card.label}</div>
            <p className="ready-prompt">How's this task going?</p>
            <div className="ready-actions">
              <button className="primary" onClick={() => recordOutcome('done')}>Done</button>
              <button className="ghost" onClick={() => recordOutcome('more-time')}>Need more time</button>
              <button className="ghost" onClick={() => recordOutcome('distracted')}>Note distraction</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
