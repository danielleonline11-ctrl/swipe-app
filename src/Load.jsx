import { useState, useRef, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { saveDeck, saveSource } from './storage.js'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

const CHECKBOX_REGEX = /^[\s•\-–—*▢☐☑✓✔︎❑❒❐□■▪◯○●⦿◉◎⚪⚫]+\s*/

const BAKED_LISTS = [
  { name: 'Wedding', slug: 'wedding' },
  { name: 'This Week', slug: 'this-week' },
  { name: 'Triage', slug: 'triage' },
  { name: 'Basic Needs', slug: 'basic-needs' },
]

function cleanLine(raw) {
  return raw.replace(CHECKBOX_REGEX, '').trim()
}

function formatFreshness(iso) {
  if (!iso) return 'never synced'
  const then = new Date(iso).getTime()
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

async function extractLinesFromPdf(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const lines = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const tc = await page.getTextContent()
    let current = ''
    let lastY = null
    for (const item of tc.items) {
      const y = item.transform?.[5]
      const newLine = lastY !== null && Math.abs(y - lastY) > 2
      if (newLine) {
        const cleaned = cleanLine(current)
        if (cleaned) lines.push(cleaned)
        current = ''
      }
      current += item.str
      lastY = y
    }
    const cleaned = cleanLine(current)
    if (cleaned) lines.push(cleaned)
  }
  return lines
}

export default function Load({ deck, setDeck, setScreen }) {
  const [listName, setListName] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [bakedMeta, setBakedMeta] = useState({})
  const fileRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(
      BAKED_LISTS.map(async (l) => {
        try {
          const res = await fetch(`/lists/${l.slug}.json`, { cache: 'no-store' })
          if (!res.ok) return [l.slug, null]
          const data = await res.json()
          return [l.slug, { fetchedAt: data.fetchedAt, count: (data.cards || []).length }]
        } catch {
          return [l.slug, null]
        }
      })
    ).then((entries) => {
      if (cancelled) return
      const next = {}
      for (const [slug, meta] of entries) if (meta) next[slug] = meta
      setBakedMeta(next)
    })
    return () => { cancelled = true }
  }, [])

  async function loadBakedList(slug, name) {
    setError(null)
    setParsing(true)
    setPreview(null)
    try {
      const res = await fetch(`/lists/${slug}.json`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const cards = (data.cards || []).map((c, i) => ({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        label: c.label,
        list: data.name || name,
        description: c.description || '',
      }))
      if (cards.length === 0) throw new Error('List is empty')
      setBakedMeta((m) => ({ ...m, [slug]: { fetchedAt: data.fetchedAt, count: cards.length } }))
      stageDeck(cards, data.name || name)
      setPreview({
        lines: cards.length,
        cards: cards.length,
        source: data.name || name,
        fetchedAt: data.fetchedAt,
        sample: cards.slice(0, 5).map((c) => c.label),
      })
    } catch (err) {
      setError(`Couldn't load ${name}: ${err.message}. Run \`./scripts/sync-lists.sh\` on your Mac, then commit + push.`)
    } finally {
      setParsing(false)
    }
  }

  function makeCards(lines, source) {
    return lines
      .filter((l) => l.length > 1)
      .map((label, i) => ({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        label,
        list: source || 'Imported',
        description: '',
      }))
  }

  async function handlePdf(file) {
    if (!file) return
    setError(null)
    setParsing(true)
    setPreview(null)
    try {
      const lines = await extractLinesFromPdf(file)
      const source = listName.trim() || file.name.replace(/\.pdf$/i, '') || 'Imported'
      const cards = makeCards(lines, source)
      setPreview({ lines: lines.length, cards: cards.length, source, sample: cards.slice(0, 5).map((c) => c.label) })
      stageDeck(cards, source)
    } catch (err) {
      setError(`PDF parse failed: ${err.message}`)
    } finally {
      setParsing(false)
    }
  }

  function handlePaste() {
    const lines = pasteText.split('\n').map(cleanLine).filter(Boolean)
    if (lines.length === 0) {
      setError('No reminders found in pasted text.')
      return
    }
    const source = listName.trim() || 'Pasted'
    const cards = makeCards(lines, source)
    setPreview({ lines: lines.length, cards: cards.length, source, sample: cards.slice(0, 5).map((c) => c.label) })
    stageDeck(cards, source)
    setPasteText('')
  }

  function stageDeck(cards, source) {
    setDeck(cards)
    saveDeck(cards)
    saveSource(source)
  }

  function startSwipe() {
    setScreen('swipe')
  }

  function appendToDeck(file) {
    if (!file) return
    setError(null)
    setParsing(true)
    extractLinesFromPdf(file)
      .then((lines) => {
        const source = listName.trim() || file.name.replace(/\.pdf$/i, '') || 'Imported'
        const cards = makeCards(lines, source)
        const merged = [...deck, ...cards]
        setDeck(merged)
        saveDeck(merged)
        setPreview({ lines: lines.length, cards: cards.length, source, appended: true, sample: cards.slice(0, 5).map((c) => c.label) })
      })
      .catch((err) => setError(`PDF parse failed: ${err.message}`))
      .finally(() => setParsing(false))
  }

  return (
    <div className="load">
      <h1>Load reminders</h1>
      <p className="hint">Tap a list to load it. Re-sync from Mac when you want fresh data.</p>

      <div className="load-section">
        <label className="load-label">My lists</label>
        <div className="baked-lists">
          {BAKED_LISTS.map((l) => (
            <button
              key={l.slug}
              className="baked-list-btn"
              onClick={() => loadBakedList(l.slug, l.name)}
              disabled={parsing}
            >
              <span className="baked-list-name">{l.name}</span>
              {bakedMeta[l.slug] ? (
                <span className="baked-list-meta">
                  {bakedMeta[l.slug].count} · {formatFreshness(bakedMeta[l.slug].fetchedAt)}
                </span>
              ) : (
                <span className="baked-list-meta">not synced</span>
              )}
            </button>
          ))}
        </div>
        <p className="load-sub">
          Refresh: <code>./scripts/sync-lists.sh</code> on Mac → <code>git push</code>.
        </p>
      </div>

      <div className="load-section">
        <label className="load-label">Source label (optional)</label>
        <input
          className="load-input"
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="e.g. Wedding, Triage, Career"
          autoCapitalize="words"
          autoCorrect="off"
        />
        <p className="load-sub">Tags every card from this upload with this list name. Defaults to the PDF filename.</p>
      </div>

      <div className="load-section">
        <label className="load-label">PDF upload</label>
        <p className="load-sub">Print your Reminders list to PDF (File → Print → Save as PDF) and upload it here.</p>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handlePdf(f)
            e.target.value = ''
          }}
        />
        <button
          className="primary"
          onClick={() => fileRef.current?.click()}
          disabled={parsing}
        >
          {parsing ? 'Parsing…' : 'Choose PDF'}
        </button>
        {deck.length > 0 && (
          <button
            className="secondary"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'application/pdf,.pdf'
              input.onchange = (e) => {
                const f = e.target.files?.[0]
                if (f) appendToDeck(f)
              }
              input.click()
            }}
            disabled={parsing}
            style={{ marginTop: '8px' }}
          >
            Append another PDF to current deck
          </button>
        )}
      </div>

      <div className="load-section">
        <label className="load-label">Or paste lines</label>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={'One reminder per line…\nFold the seat tags\nReview videographers in portal\nSchedule June facial'}
          rows={6}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <button
          className="secondary"
          onClick={handlePaste}
          disabled={!pasteText.trim()}
        >
          Build deck from paste
        </button>
      </div>

      {deck.length > 0 && (
        <div className="load-actions">
          <button className="primary" onClick={startSwipe} style={{ flex: 1 }}>
            Swipe {deck.length} card{deck.length === 1 ? '' : 's'} →
          </button>
        </div>
      )}

      {preview && (
        <div className="load-status">
          {preview.appended ? 'Appended ' : 'Loaded '}{preview.cards} cards from "{preview.source}"
          {preview.lines !== preview.cards && (
            <span className="breakdown"> ({preview.lines} raw lines, dropped empties + headers)</span>
          )}
          {preview.sample?.length > 0 && (
            <ul className="preview-list">
              {preview.sample.map((s, i) => (<li key={i}>{s}</li>))}
              {preview.cards > preview.sample.length && (
                <li className="more">…and {preview.cards - preview.sample.length} more</li>
              )}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="load-error">
          <strong>Load failed.</strong>
          <pre>{error}</pre>
        </div>
      )}
    </div>
  )
}
