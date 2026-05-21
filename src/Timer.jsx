import { useEffect, useRef, useState } from 'react'

const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

export default function Timer({ card, onClose }) {
  const [phase, setPhase] = useState('work')
  const [remaining, setRemaining] = useState(WORK_SECONDS)
  const [running, setRunning] = useState(true)
  const [blocksDone, setBlocksDone] = useState(0)
  const tickRef = useRef(null)

  useEffect(() => {
    if (!running) return
    tickRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [running])

  useEffect(() => {
    if (remaining > 0) return
    if (phase === 'work') {
      setRunning(false)
      setBlocksDone((b) => b + 1)
      try { navigator.vibrate?.([200, 100, 200]) } catch {}
    } else if (phase === 'break') {
      setPhase('work')
      setRemaining(WORK_SECONDS)
    }
  }, [remaining, phase])

  function addPomodoro() {
    setPhase('break')
    setRemaining(BREAK_SECONDS)
    setRunning(true)
  }

  function stopAndClose() {
    setRunning(false)
    onClose()
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const done = remaining === 0

  return (
    <div className="timer-overlay">
      <div className="timer-card">
        <div className="timer-task">{card.label}</div>
        <div className={`timer-phase ${phase}`}>
          {phase === 'work' ? `Pomodoro ${blocksDone + 1}` : 'Break'}
        </div>
        <div className={`timer-clock ${done ? 'done' : ''}`}>{mm}:{ss}</div>

        {!done && phase === 'work' && (
          <div className="timer-actions">
            <button className="ghost" onClick={() => setRunning((r) => !r)}>
              {running ? 'Pause' : 'Resume'}
            </button>
            <button className="ghost" onClick={stopAndClose}>End early</button>
          </div>
        )}

        {!done && phase === 'break' && (
          <div className="timer-actions">
            <button className="ghost" onClick={() => setRunning((r) => !r)}>
              {running ? 'Pause break' : 'Resume'}
            </button>
            <button className="ghost" onClick={stopAndClose}>Skip break</button>
          </div>
        )}

        {done && phase === 'work' && (
          <div className="timer-end">
            <p>Block done. {blocksDone + 0 === 0 ? '' : `${blocksDone + 1} block${blocksDone + 1 === 1 ? '' : 's'} total.`}</p>
            <div className="timer-actions">
              <button className="primary" onClick={addPomodoro}>+ Add pomodoro (5m break → 25m work)</button>
              <button className="ghost" onClick={stopAndClose}>I'm done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
