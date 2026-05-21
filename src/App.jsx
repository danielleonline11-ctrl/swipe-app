import { useState, useEffect } from 'react'
import Load from './Load.jsx'
import Swipe from './Swipe.jsx'
import Piles from './Piles.jsx'
import { loadScreen, saveScreen, loadDeck, loadPiles, clearAll } from './storage.js'

export default function App() {
  const [screen, setScreen] = useState(loadScreen())
  const [deck, setDeck] = useState(loadDeck())
  const [piles, setPiles] = useState(loadPiles())

  useEffect(() => { saveScreen(screen) }, [screen])

  function resetAll() {
    if (!window.confirm('Clear deck, piles, and all cached data? This cannot be undone.')) return
    clearAll()
    setDeck([])
    setPiles({ engage: [], skip: [], blocked: [], drop: [] })
    setScreen('load')
  }

  return (
    <div className="app">
      <nav className="nav">
        <button
          className={screen === 'load' ? 'active' : ''}
          onClick={() => setScreen('load')}
        >
          Load
        </button>
        <button
          className={screen === 'swipe' ? 'active' : ''}
          onClick={() => setScreen('swipe')}
          disabled={deck.length === 0}
        >
          Swipe ({deck.length})
        </button>
        <button
          className={screen === 'piles' ? 'active' : ''}
          onClick={() => setScreen('piles')}
        >
          Piles
        </button>
        <button className="reset" onClick={resetAll} title="Reset everything">
          ⟲
        </button>
      </nav>
      <main>
        {screen === 'load' && (
          <Load deck={deck} setDeck={setDeck} setScreen={setScreen} />
        )}
        {screen === 'swipe' && (
          <Swipe
            deck={deck}
            setDeck={setDeck}
            piles={piles}
            setPiles={setPiles}
            setScreen={setScreen}
          />
        )}
        {screen === 'piles' && <Piles piles={piles} setPiles={setPiles} />}
      </main>
    </div>
  )
}
