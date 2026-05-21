import { getClient, getReminderLists } from './_caldav.js'

export default async function handler(req, res) {
  try {
    const client = await getClient()
    const url = new URL(req.url, `http://${req.headers.host}`)
    const showAll = url.searchParams.get('all') === '1'

    const allCalendars = await client.fetchCalendars()
    const reminderLists = await getReminderLists(client)

    if (showAll) {
      return res.status(200).json({
        totalCalendars: allCalendars.length,
        reminderListsCount: reminderLists.length,
        allCalendars: allCalendars.map((c) => ({
          name: c.displayName,
          url: c.url,
          components: c.components,
          resourcetype: c.resourcetype,
          ctag: c.ctag,
        })),
      })
    }

    return res.status(200).json({
      count: reminderLists.length,
      lists: reminderLists.map((l) => ({
        name: l.displayName,
        url: l.url,
      })),
    })
  } catch (err) {
    console.error('api/lists error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}
