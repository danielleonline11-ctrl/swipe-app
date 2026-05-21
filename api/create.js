import ICAL from 'ical.js'
import { getClient, getReminderLists } from './_caldav.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' })
  }
  try {
    const body = await readBody(req)
    const { summary, listName, description, parentUid } = body
    if (!summary) return res.status(400).json({ error: 'Missing summary' })
    if (!listName) return res.status(400).json({ error: 'Missing listName' })

    const client = await getClient()
    const lists = await getReminderLists(client)
    const calendar = lists.find(
      (l) => (l.displayName || '').toLowerCase() === listName.toLowerCase()
    )
    if (!calendar) return res.status(404).json({ error: `List "${listName}" not found` })

    const uid = generateUid()
    const ical = buildVTodo({ uid, summary, description, parentUid })
    const filename = `${uid}.ics`

    await client.createCalendarObject({
      calendar,
      filename,
      iCalString: ical,
    })

    return res.status(200).json({ ok: true, uid, list: listName })
  } catch (err) {
    console.error('api/create error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}

function generateUid() {
  return `swipe-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@swipe-app.vercel.app`
}

function buildVTodo({ uid, summary, description, parentUid }) {
  const comp = new ICAL.Component(['vcalendar', [], []])
  comp.addPropertyWithValue('prodid', '-//swipe-app//v0.2//EN')
  comp.addPropertyWithValue('version', '2.0')

  const todo = new ICAL.Component('vtodo')
  todo.addPropertyWithValue('uid', uid)
  todo.addPropertyWithValue('summary', summary)
  if (description) todo.addPropertyWithValue('description', description)
  todo.addPropertyWithValue('status', 'NEEDS-ACTION')
  todo.addPropertyWithValue('created', ICAL.Time.now())
  todo.addPropertyWithValue('dtstamp', ICAL.Time.now())
  if (parentUid) {
    todo.addPropertyWithValue('related-to', parentUid)
  }

  comp.addSubcomponent(todo)
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
