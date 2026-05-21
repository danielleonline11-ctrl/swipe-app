import { getClient, getReminderLists, fetchListReminders } from './_caldav.js'

const QUEUE_PRIORITY_LISTS = ['Triage', 'This Week']
const DUE_WINDOW_DAYS = 30
const OLDEST_BACKFILL_COUNT = 20

export default async function handler(req, res) {
  try {
    const client = await getClient()
    const url = new URL(req.url, `http://${req.headers.host}`)
    const listParam = url.searchParams.get('list')
    const mode = url.searchParams.get('mode') || 'queue'

    const allLists = await getReminderLists(client)

    if (listParam) {
      const target = allLists.find(
        (l) => (l.displayName || '').toLowerCase() === listParam.toLowerCase()
      )
      if (!target) {
        return res.status(404).json({ error: `List "${listParam}" not found`, available: allLists.map((l) => l.displayName) })
      }
      const reminders = await fetchListReminders(client, target)
      return res.status(200).json({ list: listParam, count: reminders.length, reminders })
    }

    if (mode === 'queue') {
      const queue = await buildQueue(client, allLists)
      return res.status(200).json(queue)
    }

    return res.status(400).json({ error: 'Unknown mode', mode })
  } catch (err) {
    console.error('api/reminders error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}

async function buildQueue(client, allLists) {
  const perList = await Promise.all(
    allLists.map(async (cal) => ({
      list: cal.displayName,
      reminders: await fetchListReminders(client, cal),
    }))
  )

  const allReminders = perList.flatMap((p) => p.reminders)
  const byUid = new Map()
  for (const r of allReminders) {
    if (r.uid && !byUid.has(r.uid)) byUid.set(r.uid, r)
  }

  const priorityListsLower = QUEUE_PRIORITY_LISTS.map((s) => s.toLowerCase())
  const inPriority = []
  const dueSoon = []
  const oldestPool = []

  const now = new Date()
  const dueWindowMs = DUE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const dueCutoff = new Date(now.getTime() + dueWindowMs)

  for (const r of byUid.values()) {
    const listLower = (r.list || '').toLowerCase()
    const isPriority = priorityListsLower.includes(listLower)
    const isDueSoon = r.dueAt && new Date(r.dueAt) <= dueCutoff
    if (isPriority) inPriority.push(r)
    else if (isDueSoon) dueSoon.push(r)
    else oldestPool.push(r)
  }

  const priorityRank = (r) => {
    const idx = priorityListsLower.indexOf((r.list || '').toLowerCase())
    return idx === -1 ? 999 : idx
  }

  inPriority.sort((a, b) => priorityRank(a) - priorityRank(b))
  dueSoon.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
  oldestPool.sort((a, b) => {
    const ac = a.createdAt ? new Date(a.createdAt).getTime() : Infinity
    const bc = b.createdAt ? new Date(b.createdAt).getTime() : Infinity
    return ac - bc
  })

  const backfill = oldestPool.slice(0, OLDEST_BACKFILL_COUNT)
  const queue = [...inPriority, ...dueSoon, ...backfill]

  return {
    count: queue.length,
    breakdown: {
      priority: inPriority.length,
      dueSoon: dueSoon.length,
      backfill: backfill.length,
    },
    lists: allLists.map((l) => l.displayName),
    queue,
  }
}
