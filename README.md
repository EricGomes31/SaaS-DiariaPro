# Diária Pro

A modern SaaS for managing Brazilian day laborers (*diaristas*). Built as a frontend-only React SPA with a clean, dark-themed UI — designed to make tracking workers, work days, locations, and payments simple and visual.

---

## Features

- **Dashboard** — animated KPI cards, payment trend charts, and weekly breakdown at a glance
- **Worker Management** — register workers with department, job title, shift, daily rates (weekday and weekend/holiday), and PIX key
- **Work Calendar** — visual month calendar for logging and reviewing work days per worker and location
- **Payment View** — per-worker payment summary with weekday vs. weekend breakdown, PIX QR code generation, and payment confirmation
- **Reports** — area charts, bar charts, and top-earner rankings with 7-day and 30-day filters
- **Location Manager** — manage work sites, view days and earnings per location with comparative charts
- **Export** — CSV (Excel/Google Sheets compatible) and PDF via browser print dialog
- **i18n** — fully translated in Portuguese (pt-BR), English (en), and Spanish (es)
- **Dark / Light theme** — toggleable with persistent UI state

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tooling |
| Tailwind CSS 4.x | Styling via `@tailwindcss/vite`, themed with CSS custom properties |
| Framer Motion | Page transitions and micro-interactions |
| Recharts | AreaChart, BarChart, PieChart in Dashboard, Payments, and Reports |
| Lucide React | Icon set |
| date-fns | Date formatting with `ptBR` locale |
| qrcode.react | PIX QR code generation |

---

## Getting Started

```bash
npm install
npm run dev       # Dev server with hot reload → http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview the production build locally
```

**Demo login:**
- Email: `admin@diariapro.com`
- Password: `admin123`

---

## Project Structure

```
src/
├── App.jsx                        # Root: routing, auth, theme, language state
├── data/
│   ├── mockData.js                # All mock data + helper functions (single source of truth)
│   └── storage.js                 # Local state helpers
├── components/
│   ├── Auth/LoginScreen.jsx
│   ├── Dashboard/Dashboard.jsx
│   ├── Workers/                   # WorkerList, WorkerProfile, WorkerModal
│   ├── Tracking/WorkCalendar.jsx
│   ├── Payments/PaymentView.jsx
│   ├── Reports/Reports.jsx
│   ├── Locations/LocationManager.jsx
│   └── Layout/                    # Sidebar, SettingsPanel, NotificationsPanel
├── hooks/useIsMobile.js
└── i18n.js                        # pt / en / es label strings
```

---

## Notes

- No router library — navigation is handled via a `currentPage` state string in `App.jsx`
- No global state manager — all state is prop-drilled from `App.jsx`
- Brazilian public holidays for 2025 are hardcoded in `mockData.js`
- There is no backend or database; all data lives in `src/data/mockData.js`
