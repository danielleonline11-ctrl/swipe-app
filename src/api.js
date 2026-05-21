async function jsonOrThrow(res) {
  if (!res.ok) {
    let body = ''
    try { body = await res.text() } catch {}
    throw new Error(`${res.status} ${res.statusText} — ${body}`)
  }
  return res.json()
}

export async function fetchQueue() {
  const res = await fetch('/api/reminders')
  return jsonOrThrow(res)
}

export async function fetchList(name) {
  const res = await fetch(`/api/reminders?list=${encodeURIComponent(name)}`)
  return jsonOrThrow(res)
}

export async function fetchLists() {
  const res = await fetch('/api/lists')
  return jsonOrThrow(res)
}

export async function postNote({ uid, note, listName }) {
  const res = await fetch('/api/note', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ uid, note, listName }),
  })
  return jsonOrThrow(res)
}

export async function createReminder({ summary, listName, description, parentUid }) {
  const res = await fetch('/api/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ summary, listName, description, parentUid }),
  })
  return jsonOrThrow(res)
}
