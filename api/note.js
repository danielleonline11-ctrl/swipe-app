import ICAL from 'ical.js'
import { getClient, getReminderLists } from './_caldav.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' })
  }
  try {
    const body = await readBody(req)
    const { uid, note, listName } = body
    if (!uid || !note) {
      return res.status(400).json({ error: 'Missing uid or note' })
    }

    const client = await getClient()
    const lists = await getReminderLists(client)

    const candidateLists = listName
      ? lists.filter((l) => (l.displayName || '').toLowerCase() === listName.toLowerCase())
      : lists

    for (const calendar of candidateLists) {
      const objects = await client.fetchCalendarObjects({ calendar })
      const match = objects.find((o) => extractUid(o.data) === uid)
      if (!match) continue

      const updatedICal = appendNoteToVTodo(match.data, note)
      await client.updateCalendarObject({
        calendarObject: {
          url: match.url,
          data: updatedICal,
          etag: match.etag,
        },
      })

      return res.status(200).json({ ok: true, uid, list: calendar.displayName })
    }

    return res.status(404).json({ error: `Reminder with uid ${uid} not found` })
  } catch (err) {
    console.error('api/note error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}

function extractUid(rawICal) {
  try {
    const jcal = ICAL.parse(rawICal)
    const comp = new ICAL.Component(jcal)
    const todoComp = comp.getFirstSubcomponent('vtodo')
    if (!todoComp) return null
    const prop = todoComp.getFirstProperty('uid')
    return prop ? prop.getFirstValue()?.toString() : null
  } catch {
    return null
  }
}

function appendNoteToVTodo(rawICal, noteText) {
  const jcal = ICAL.parse(rawICal)
  const comp = new ICAL.Component(jcal)
  const todoComp = comp.getFirstSubcomponent('vtodo')

  const existingDesc = todoComp.getFirstPropertyValue('description') || ''
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const newLine = `[🤖 ${stamp}] ${noteText}`
  const combined = existingDesc ? `${existingDesc}\n\n${newLine}` : newLine

  todoComp.removeAllProperties('description')
  todoComp.addPropertyWithValue('description', combined)

  todoComp.removeAllProperties('last-modified')
  todoComp.addPropertyWithValue('last-modified', ICAL.Time.now())

  return comp.toString()
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body)
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}
