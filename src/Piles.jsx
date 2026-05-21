import { useState } from 'react'
import { savePiles } from './storage.js'

const PILES = [
  { key: 'engage', label: 'Engage' },
  { key: 'skip', label: 'Skip' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'drop', label: 'Drop' },
]

export default function Piles({ piles, setPiles }) {
  const [active, setActive] = useState('engage')
  const [editingId, setEditingId] = useState(null)
  const [commentText, setCommentText] = useState('')

  const list = piles[active] || []

  function startUnblock(cardId) {
    setEditingId(cardId)
    setCommentText('')
  }

  function cancelUnblock() {
    setEditingId(null)
    setCommentText('')
  }

  function commitUnblock(card) {
    const trimmed = commentText.trim()
    if (!trimmed) return
    const updated = {
      ...card,
      comment: trimmed,
      unblockedAt: new Date().toISOString(),
    }
    const newPiles = {
      ...piles,
      blocked: piles.blocked.filter((c) => c.id !== card.id),
      engage: [...piles.engage, updated],
    }
    setPiles(newPiles)
    savePiles(newPiles)
    setEditingId(null)
    setCommentText('')
  }

  return (
    <div className="piles">
      <div className="pile-tabs">
        {PILES.map((p) => (
          <button
            key={p.key}
            className={`pile-tab ${p.key} ${active === p.key ? 'active' : ''}`}
            onClick={() => setActive(p.key)}
          >
            <span className="pile-label">{p.label}</span>
            <span className="count">{piles[p.key]?.length || 0}</span>
          </button>
        ))}
      </div>
      <div className="pile-list">
        {list.length === 0 ? (
          <p className="empty">No cards in this pile yet.</p>
        ) : (
          list.map((card) => (
            <div key={card.id} className={`pile-card ${active}`}>
              <div className="card-text">{card.label}</div>
              {card.comment && (
                <div className="card-comment">“{card.comment}”</div>
              )}
              {active === 'blocked' && editingId !== card.id && (
                <button
                  className="unblock-btn"
                  onClick={() => startUnblock(card.id)}
                >
                  Unblock with comment →
                </button>
              )}
              {active === 'blocked' && editingId === card.id && (
                <div className="unblock-form">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="What changed? What info did you get? Why is this now actionable?"
                    rows={3}
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <div className="unblock-actions">
                    <button className="cancel" onClick={cancelUnblock}>
                      Cancel
                    </button>
                    <button
                      className="submit"
                      onClick={() => commitUnblock(card)}
                      disabled={!commentText.trim()}
                    >
                      Move to Engage
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
