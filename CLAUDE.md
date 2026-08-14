# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (hot reload) — http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview the production build locally
npm run lint      # Biome check (lint + format check)
npm run lint:fix  # Biome check --write (auto-fix)
npm run knip      # Find unused files/exports/dependencies
```

After `npm run build`, generate the deploy zip:
```powershell
Compress-Archive -Path 'dist/*' -DestinationPath 'hostgator-upload.zip' -Force
```

## Project Overview

**Diária Pro** is a SaaS for managing Brazilian day laborers (*diaristas*). It uses React + Supabase (auth, PostgreSQL, realtime).

- Primary language: Brazilian Portuguese (pt-BR), with English (en) and Spanish (es) i18n
- Auth: Supabase Auth — real login, invite flow, idle timeout (1h)
- Data: Supabase PostgreSQL with Row Level Security (RLS)

## Landing Page

`public/apresentacao-diaria-pro.html` — standalone HTML landing page (no React).

- Served at the domain root via `.htaccess` `RewriteRule ^$ ...`
- CTA buttons link to `/entrar`, which `.htaccess` rewrites to `index.html` (React app)
- Edit directly in `public/` — Vite copies it to `dist/` on build
- Test locally: `npm run dev` → `http://localhost:5173/apresentacao-diaria-pro.html`
- Contact form uses Formspree (`xqeodkbr`), email: `diarias.pro@gmail.com`

## Deployment (Hostgator)

Upload `hostgator-upload.zip` → extract into `public_html/`. The `.htaccess` handles:
- `/` → `apresentacao-diaria-pro.html` (landing page)
- `/entrar` → `index.html` (React app / login)
- All other routes → `index.html` (SPA fallback)

## Git Workflow: Issues & Pull Requests

This repository uses GitHub Issues + Pull Requests to plan and ship every change, and to manage deploys. This convention applies to **any agent, of any model**, working in this repo — not just Claude Code.

1. **One Issue per task.** Before starting a fix, improvement, or new feature, create a GitHub Issue for it (`gh issue create`). Title it clearly and label it `bug`, `enhancement`, or `feature`.
2. **One branch per Issue.** Branch off `master` with a descriptive name (`fix/...`, `feat/...`, `chore/...`).
3. **No direct pushes to `master`.** Work lands via a Pull Request, reviewed and merged — the PR merge is what represents a deploy-ready change.
4. **Always link the Issue in the PR description**, e.g. `Closes #123` (or `Refs #123` if the PR doesn't fully resolve it) — so merging auto-closes the issue and history stays traceable.
5. Keep PRs scoped to one Issue/topic where practical, so `git log`/PR history stays a reliable record of *why* a change happened.
6. **Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)** (`feat:`, `fix:`, `chore:`, `docs:`, ...), enforced by commitlint via a husky `commit-msg` hook (`commitlint.config.js`, `.husky/commit-msg`). This runs automatically on every `git commit` once `npm install` has run (`prepare` script installs the hooks).

If `gh` isn't installed/authenticated in the current environment, say so explicitly rather than skipping issue/PR creation silently.

## Architecture

### Routing and State

There is no router library. Navigation is handled entirely in `App.jsx` via a `currentPage` state string and a `switch`-style render. `App.jsx` also owns:

- `isAuthenticated` (login gate)
- `theme` (`dark`/`light`) — applied as `data-theme` attribute on `document.documentElement`
- `language` (`pt`/`en`/`es`)
- `selectedWorker` — passed down when navigating to `WorkerProfile`

All state is prop-drilled from `App.jsx` through `Sidebar.jsx` and into page components. There is no global state manager (no Redux, no Context API).

### Data Layer

Persistence is **Supabase PostgreSQL** with Row Level Security, accessed through `src/lib/db.js`:

- `fetchAll()` loads workers, work days, locations, payment records, holidays, expenses and subscription on login; row↔object mappers (`workerFromRow`/`workerToRow`, etc.) convert between snake_case columns and camelCase app objects.
- Writes flow through sync effects in `App.jsx`: each collection (`workers`, `workDays`, `paymentRecords`, `locations`) has a `useEffect` that diffs the previous array against the new one and calls `db.upsertX`/`db.deleteX`. Components mutate state via `setWorkers`/`setWorkDays`/etc. (prop-drilled) and persistence happens automatically.
- Realtime: postgres_changes subscriptions in `App.jsx` reload data when another session writes.
- Schema lives in `supabase/schema.sql`; incremental migrations in `supabase/add-*.sql` / `fix-*.sql` (run manually in the Supabase SQL Editor).

`src/data/mockData.js` remains as the **calculation/constants module** (no longer a data store):

- `isWeekendOrHoliday(date, holidays)`, `getWorkerDayRate(worker, date, holidays)` — rate rules
- `getWorkerStats(workerId, workDays)`, `getDashboardStats(...)` — aggregations over passed-in data
- `PIX_KEY_TYPES`, `JOB_TITLES` and other UI constants (note: department filters derive options from registered workers, not from the static `DEPARTMENTS`)

Edge functions in `supabase/functions/` (send-weekly-report, send-payment-receipt, create-checkout, asaas-webhook) are deployed separately via the Supabase dashboard/CLI.

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
