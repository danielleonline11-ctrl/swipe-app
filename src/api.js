// PDF-upload stopgap: no backend reminders source.
// Notes and child-reminder creation are queued in localStorage for a future
// native integration to drain. For now these are no-ops that resolve OK so
// the UI keeps working.

export async function postNote({ uid, note, listName }) {
  const queue = JSON.parse(localStorage.getItem('swipe-app:pendingNotes') || '[]')
  queue.push({ uid, note, listName, at: new Date().toISOString() })
  localStorage.setItem('swipe-app:pendingNotes', JSON.stringify(queue))
  return { ok: true, queued: true }
}

export async function createReminder({ summary, listName, description, parentUid }) {
  const queue = JSON.parse(localStorage.getItem('swipe-app:pendingCreates') || '[]')
  queue.push({ summary, listName, description, parentUid, at: new Date().toISOString() })
  localStorage.setItem('swipe-app:pendingCreates', JSON.stringify(queue))
  return { ok: true, queued: true }
}
