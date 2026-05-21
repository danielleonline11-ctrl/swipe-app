import { useState } from 'react'

const PILES = [
  { key: 'engage', label: 'Engage' },
  { key: 'skip', label: 'Skip' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'drop', label: 'Drop' },
]

export default function Piles({ piles }) {
  const [active, setActive] = useState('engage')
  const list = piles[active] || []

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
              {card.label}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
