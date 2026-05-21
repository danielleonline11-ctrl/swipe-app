import { createDAVClient } from 'tsdav'
import ICAL from 'ical.js'

let cachedClient = null

export async function getClient() {
  if (cachedClient) return cachedClient
  const username = process.env.APPLE_ID
  const password = process.env.APPLE_APP_PASSWORD
  if (!username || !password) {
    throw new Error('Missing APPLE_ID or APPLE_APP_PASSWORD env vars')
  }
  cachedClient = await createDAVClient({
    serverUrl: 'https://caldav.icloud.com',
    credentials: { username, password },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
  return cachedClient
}

export async function getReminderLists(client) {
  const calendars = await client.fetchCalendars()
  return calendars.filter(
    (c) => Array.isArray(c.components) && c.components.includes('VTODO')
  )
}

export async function findListByName(client, name) {
  const lists = await getReminderLists(client)
  return lists.find(
    (l) => (l.displayName || '').toLowerCase() === name.toLowerCase()
  )
}

export async function fetchVTodos(client, calendar) {
  const objects = await client.fetchCalendarObjects({ calendar })
  return objects
}

export function parseVTodo(rawICal, listName) {
  try {
    const jcal = ICAL.parse(rawICal)
    const comp = new ICAL.Component(jcal)
    const todoComp = comp.getFirstSubcomponent('vtodo')
    if (!todoComp) return null

    const get = (name) => {
      const prop = todoComp.getFirstProperty(name)
      return prop ? prop.getFirstValue() : null
    }

    const status = (get('status') || '').toString().toLowerCase()
    const completed = status === 'completed' || todoComp.getFirstProperty('completed') !== null
    if (completed) return null

    const uid = get('uid')?.toString() || null
    const summary = get('summary')?.toString() || ''
    const description = get('description')?.toString() || ''
    const due = get('due')
    const created = get('created')

    return {
      id: uid,
      uid,
      label: summary,
      description,
      list: listName,
      dueAt: due ? due.toJSDate().toISOString() : null,
      createdAt: created ? created.toJSDate().toISOString() : null,
      status: status || 'needs-action',
    }
  } catch (err) {
    console.error('parseVTodo error:', err.message)
    return null
  }
}

export async function fetchListReminders(client, calendar) {
  const objects = await fetchVTodos(client, calendar)
  return objects
    .map((o) => {
      const parsed = parseVTodo(o.data, calendar.displayName)
      if (!parsed) return null
      return { ...parsed, _etag: o.etag, _url: o.url, _calendarUrl: calendar.url }
    })
    .filter(Boolean)
}
