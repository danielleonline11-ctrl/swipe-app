# swipe-app

Tinder-style swipe-decision app for triaging Apple Reminders. Single-user PWA. v0.2.

## What it does

Loads reminders from iCloud via CalDAV → swipe through them four ways → tap to add a note before deciding → "Ready for it!" to do a card now (timer or URL) → review what landed in each pile.

- **Right** → Engage
- **Left** → Skip
- **Up** → Blocked
- **Down** → Drop
- **Tap card** → quick note + outcome (Engage/Skip/Block/Drop/Needs breakdown)
- **Ready for it!** → 25-min Pomodoro (with "+ Add pomodoro" extender) for task cards; or "Leave app to take in this content?" for URL/video cards with a 5-min outcome capture

## Stack

- **Front-end:** React 18 + Vite + react-tinder-card. PWA with localStorage state.
- **Back-end:** Vercel serverless functions (`/api/*`). CalDAV via `tsdav` against `caldav.icloud.com`. VTODO parsing via `ical.js`.
- **Auth:** Apple app-specific password (set via Vercel env vars `APPLE_ID` + `APPLE_APP_PASSWORD`).

## API endpoints

- `GET /api/debug` — env var presence check + node/region info
- `GET /api/lists` — discover all Reminders lists from iCloud
- `GET /api/reminders` — full queue (Triage + This Week + due-in-30d + 20 oldest backfill)
- `GET /api/reminders?list=<name>` — single list
- `POST /api/note { uid, note, listName }` — append note to a reminder's body
- `POST /api/create { summary, listName, description?, parentUid? }` — create a new reminder

## Deploy

GitHub `main` push → Vercel auto-deploys. Vercel must have `APPLE_ID` + `APPLE_APP_PASSWORD` env vars set across Production/Preview/Development.

## Limits / next sessions

- "Take me to native reminder" uses generic `x-apple-reminderkit://` scheme (opens app, not specific reminder). Per-reminder deep link is iOS-version-unreliable.
- Push notifications + service worker for "leave app, ping back in 5 min" → deferred to v0.3.
- Distraction dashboard view → events are recorded to localStorage but UI not yet built.
- Multi-device distraction store via Vercel KV → deferred.
- Service worker for PWA push permission → deferred.
