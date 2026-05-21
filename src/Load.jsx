import { useEffect, useState } from 'react'
import {
  saveDeck,
  saveSource,
  saveLists,
  saveLastFetch,
  loadLastFetch,
  loadLists,
  loadSource,
} from './storage.js'
import { fetchQueue, fetchList, fetchLists } from './api.js'

export default function Load({ deck, setDeck, setScreen }) {
  const [source, setSource] = useState(loadSource())
  const [lists, setLists] = useState(loadLists())
  const [lastFetch, setLastFetch] = useState(loadLastFetch())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    if (lists.length === 0) refreshLists()
  }, [])

  async function refreshLists() {
    try {
      const data = await fetchLists()
      const names = (data.lists || []).map((l) => l.name).filter(Boolean)
      setLists(names)
      saveLists(names)
    } catch (err) {
      setError(`Could not load lists: ${err.message}`)
    }
  }

  async function loadDeck(targetSource) {
    setLoading(true)
    setError(null)
    try {
      const data = targetSource === 'queue'
        ? await fetchQueue()
        : await fetchList(targetSource)

      const reminders = data.queue || data.reminders || []
      const cards = reminders.map((r) => ({
        id: r.uid || r.id,
        uid: r.uid,
        label: r.label,
        description: r.description,
        list: r.list,
        dueAt: r.dueAt,
        createdAt: r.createdAt,
      }))

      setDeck(cards)
      saveDeck(cards)
      setSource(targetSource)
      saveSource(targetSource)
      const now = Date.now()
      setLastFetch(now)
      saveLastFetch(now)
      setMeta({ count: cards.length, breakdown: data.breakdown })
      setScreen('swipe')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function shuffle() {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setDeck(shuffled)
    saveDeck(shuffled)
    setScreen('swipe')
  }

  const fetchAge = lastFetch ? Math.round((Date.now() - lastFetch) / 60000) : null
  const ageLabel = fetchAge === null
    ? 'Never loaded'
    : fetchAge < 1 ? 'Just now' : `${fetchAge}m ago`

  return (
    <div className="load">
      <h1>Load reminders</h1>
      <p className="hint">Pull cards from Apple Reminders via iCloud.</p>

      <div className="load-section">
        <label className="load-label">Queue (default)</label>
        <p className="load-sub">Triage + This Week + due in 30d + 20 oldest backfill.</p>
        <button
          className="primary"
          onClick={() => loadDeck('queue')}
          disabled={loading}
        >
          {loading && source === 'queue' ? 'Loading…' : 'Load queue'}
        </button>
      </div>

      <div className="load-section">
        <label className="load-label">Or one list</label>
        <div className="list-grid">
          {lists.length === 0 ? (
            <p className="load-sub">No lists cached. <button className="link" onClick={refreshLists}>Refresh lists</button></p>
          ) : (
            lists.map((name) => (
              <button
                key={name}
                className={`list-chip ${source === name ? 'active' : ''}`}
                onClick={() => loadDeck(name)}
                disabled={loading}
              >
                {name}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="load-meta">
        <span>Last load: {ageLabel}</span>
        <span>Source: {source}</span>
        <span>Deck: {deck.length}</span>
      </div>

      <div className="load-actions">
        <button
          className="secondary"
          onClick={shuffle}
          disabled={deck.length === 0}
        >
          Shuffle current deck
        </button>
        <button
          className="secondary"
          onClick={refreshLists}
          disabled={loading}
        >
          Refresh list names
        </button>
      </div>

      {meta && (
        <div className="load-status">
          Loaded {meta.count} cards.
          {meta.breakdown && (
            <span className="breakdown">
              {' '}({meta.breakdown.priority} priority · {meta.breakdown.dueSoon} due-soon · {meta.breakdown.backfill} backfill)
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="load-error">
          <strong>Load failed.</strong>
          <pre>{error}</pre>
          <p className="load-sub">Check that Vercel env vars (APPLE_ID + APPLE_APP_PASSWORD) are set, and CalDAV is reachable.</p>
        </div>
      )}
    </div>
  )
}
