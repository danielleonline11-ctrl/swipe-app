import { useState, useRef } from 'react'
import TinderCard from 'react-tinder-card'
import { saveDeck, savePiles } from './storage.js'

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

export default function Swipe({ deck, setDeck, piles, setPiles, setScreen }) {
  const [lastAction, setLastAction] = useState(null)
  const childRefs = useRef({})

  function fileCard(card, direction) {
    const pileKey = DIRECTION_TO_PILE[direction]
    if (!pileKey) return
    const newPiles = { ...piles, [pileKey]: [...piles[pileKey], card] }
    setPiles(newPiles)
    savePiles(newPiles)
    const newDeck = deck.filter((c) => c.id !== card.id)
    setDeck(newDeck)
    saveDeck(newDeck)
    setLastAction({ card, pileKey })
  }

  if (deck.length === 0) {
    return (
      <div className="swipe empty">
        <h2>Deck is empty.</h2>
        <p>Add more reminders or review what you've sorted.</p>
        <div className="actions">
          <button onClick={() => setScreen('upload')}>Add more</button>
          <button onClick={() => setScreen('piles')}>Review piles</button>
        </div>
      </div>
    )
  }

  // react-tinder-card renders LAST item on top — reverse so first item shows up first.
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
        {stackForDisplay.map((card) => (
          <TinderCard
            key={card.id}
            ref={(el) => { childRefs.current[card.id] = el }}
            className="swipe-card-wrap"
            preventSwipe={[]}
            onSwipe={(dir) => fileCard(card, dir)}
            swipeRequirementType="position"
            swipeThreshold={80}
          >
            <div className="swipe-card">
              <div className="card-body">{card.label}</div>
            </div>
          </TinderCard>
        ))}
      </div>
      <div className="button-bar">
        <button className="btn-skip" onClick={() => triggerSwipe('left')} aria-label="Skip">←</button>
        <button className="btn-drop" onClick={() => triggerSwipe('down')} aria-label="Drop">↓</button>
        <button className="btn-blocked" onClick={() => triggerSwipe('up')} aria-label="Blocked">↑</button>
        <button className="btn-engage" onClick={() => triggerSwipe('right')} aria-label="Engage">→</button>
      </div>
      <div className="counter">{deck.length} left</div>
      {lastAction && (
        <div className={`last ${lastAction.pileKey}`}>
          Last → {PILE_LABEL[lastAction.pileKey]}: {lastAction.card.label}
        </div>
      )}
    </div>
  )
}
