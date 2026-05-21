# swipe-app

Tinder-style swipe-decision app for triaging Reminders. Single-user PWA. v0.

## What it does

Paste a list of reminders → swipe through them four ways → review what landed in each pile.

- **Right** → Engage
- **Left** → Skip
- **Up** → Blocked
- **Down** → Drop

State persists in localStorage. Install as PWA on iPhone via Safari → Add to Home Screen.

## Stack

React 18 + Vite + react-tinder-card. No backend, no auth.

## Develop

This project was scaffolded for use with [StackBlitz](https://stackblitz.com) (cloud IDE — no local Node install required). To run it elsewhere, you'd need Node 18+ and:

```
npm install
npm run dev
```

## Deploy

Connect this GitHub repo to [Vercel](https://vercel.com) — auto-deploys on push to `main`.

## v0 limits / next sessions

- Engage flow with comment + voice note → s09
- Cross-session deck behaviors (skip cooldown, blocked re-entry) → s09+
- Direct Reminders import (AppleScript / iOS Shortcut bridge) → s10
- Visual redesign → after the product feel emerges

## Project context

See `~/.claude/projects/-Users-daniellesilverstein-Desktop-DANIELLE-S-LIFE-portfolio/memory/project_swipe_decision_app.md` for the locked MVP brief and strategic direction.
