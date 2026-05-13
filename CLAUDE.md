# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (hot reload)
npm run build     # Production build → dist/
npm run preview   # Preview the production build locally
```

There are no test or lint commands configured.

## Project Overview

**Diária Pro** is a SaaS for managing Brazilian day laborers (*diaristas*). It is a frontend-only React SPA — there is no backend, API, or database. All data comes from `src/data/mockData.js`.

- Primary language: Brazilian Portuguese (pt-BR), with English (en) and Spanish (es) i18n via a simple labels object in `Sidebar.jsx`
- Demo credentials (hardcoded in `LoginScreen.jsx`): `admin@diariapro.com` / `admin123`

## Architecture

### Routing and State

There is no router library. Navigation is handled entirely in `App.jsx` via a `currentPage` state string and a `switch`-style render. `App.jsx` also owns:

- `isAuthenticated` (login gate)
- `theme` (`dark`/`light`) — applied as `data-theme` attribute on `document.documentElement`
- `language` (`pt`/`en`/`es`)
- `selectedWorker` — passed down when navigating to `WorkerProfile`

All state is prop-drilled from `App.jsx` through `Sidebar.jsx` and into page components. There is no global state manager (no Redux, no Context API).

### Data Layer

`src/data/mockData.js` is the single source of truth. It exports:

- `WORKERS`, `WORK_DAYS`, `LOCATIONS`, `DEPARTMENTS`, `JOB_TITLES` — static arrays
- `isWeekendOrHoliday(date)` — Brazilian holidays for 2025 are hardcoded
- `getWorkerStats(workerId)` — computes earnings, days worked, etc. from `WORK_DAYS`
- `getDashboardStats()` — aggregated stats for the Dashboard

Any feature that reads or writes data must go through this file since there is no persistence layer.

### Styling System

- **Tailwind CSS 4.x** via `@tailwindcss/vite` (no `tailwind.config.js` — configured through `src/index.css` with `@theme`)
- **CSS custom properties** in `index.css` drive theming. Dark mode is default; light mode is toggled via `[data-theme="light"]` on `<html>`.
- Common visual patterns used throughout: glass morphism (`backdrop-filter: blur`), gradient text, ambient background orbs, glow effects — all defined as utility classes in `index.css`.
- Inline styles are used in components for dynamic/computed values (e.g., chart colors, conditional ring colors).

### Animation

Framer Motion (`framer-motion`) is used for:
- Page transitions (`AnimatePresence` + `motion.div` in `App.jsx`)
- Card/button hover and tap interactions inside page components

### Key Libraries

| Library | Purpose |
|---|---|
| `recharts` | Charts in Dashboard and Reports (AreaChart, BarChart, PieChart) |
| `lucide-react` | All icons |
| `date-fns` | Date formatting (uses `ptBR` locale) |
| `framer-motion` | Animations and transitions |

### Payment Export

`PaymentView.jsx` implements CSV export (with UTF-8 BOM for Excel compatibility) and PDF export via the browser's native print dialog. No external export libraries are used.
