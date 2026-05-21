import { getClient, getReminderLists } from './_caldav.js'

export default async function handler(req, res) {
  try {
    const client = await getClient()
    const lists = await getReminderLists(client)
    return res.status(200).json({
      count: lists.length,
      lists: lists.map((l) => ({
        name: l.displayName,
        url: l.url,
      })),
    })
  } catch (err) {
    console.error('api/lists error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}
