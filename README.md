# swipe-app

Tinder-style swipe-decision app for triaging Apple Reminders. Single-user PWA. v0.2.

## What it does

Upload a PDF of your Reminders → swipe through them four ways → tap to add a note before deciding → "Ready for it!" to do a card now (timer or URL) → review what landed in each pile.

- **Right** → Engage
- **Left** → Skip
- **Up** → Blocked
- **Down** → Drop (reviewable — non-destructive)
- **Tap card** → quick note + outcome (Engage/Skip/Block/Drop/Needs breakdown)
- **Ready for it!** → 25-min Pomodoro (with "+ Add pomodoro" extender) for task cards; or "Leave app to take in this content?" for URL/video cards with a 5-min outcome capture

## Loading reminders

**Stopgap:** PDF upload (or text paste). Apple's upgraded Reminders format doesn't expose to CalDAV for third-party clients, so direct sync needs a different bridge (iOS Shortcut → webhook) — deferred to a later milestone.

- Mac: Reminders → File → Print → Save as PDF → upload here
- iPhone: Reminders → Share → Print → pinch-out the preview → Save to Files → upload here

PDF text is extracted client-side via `pdfjs-dist`. Lines beginning with checkbox glyphs (☐, •, dashes, etc.) are stripped. Each non-empty line becomes a card.

## Stack

- React 18 + Vite + react-tinder-card
- `pdfjs-dist` (client-side PDF text extraction)
- localStorage for deck/piles/preferences
- No backend — static SPA deployed to Vercel

## Deploy

GitHub `main` push → Vercel auto-deploys.

## Limits / deferred to next sessions

- Direct Reminders sync (iOS Shortcut → webhook bridge → server-side cache)
- Note + child-reminder write-back to native Reminders (currently queued in localStorage)
- Service worker + push notifications for the URL-flow 5-min check-in
- Distraction dashboard view (events are recorded; UI deferred)
- Per-reminder deep link (iOS scheme is finicky — currently opens Reminders app generically)
