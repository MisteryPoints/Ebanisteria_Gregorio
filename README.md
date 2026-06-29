# Ebanistería Gregorio — Taller

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/TanStack_Start-1.168-FF4154?logo=react&logoColor=white" alt="TanStack Start"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8"/>
  <img src="https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white" alt="Bun"/>
  <br/>
  <img src="https://img.shields.io/badge/Radix_UI-161618?logo=radixui&logoColor=white" alt="Radix UI"/>
  <img src="https://img.shields.io/badge/shadcn/ui-000?logo=shadcnui&logoColor=white" alt="shadcn/ui"/>
  <img src="https://img.shields.io/badge/Recharts-FF6C37?logo=recharts&logoColor=white" alt="Recharts"/>
  <img src="https://img.shields.io/badge/SSR_Nitro-00DC82?logo=nuxt&logoColor=white" alt="Nitro SSR"/>
  <img src="https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white" alt="Zod"/>
  <img src="https://img.shields.io/badge/react--hook--form-EC5990?logo=reacthookform&logoColor=white" alt="React Hook Form"/>
</p>

<p align="center">
  <strong>A fully offline, tablet-first workshop management dashboard for small carpentry and cabinet-making businesses.</strong><br/>
  Built with bleeding-edge React — zero backend, zero database, zero internet required.
</p>

---

## Overview

**Ebanistería Gregorio** is a complete single-page application (SPA) purpose-built for a real carpentry workshop. It replaces scattered paper notes, messy spreadsheets, and mental math with a clean, touch-optimized dashboard that runs entirely in the browser.

Every piece of data — inventory, budgets, tasks, capital — lives in `localStorage`. No servers to deploy, no databases to maintain, no internet connection needed. Turn on a tablet, open the page, and the workshop runs itself.

---

## Features

### 📊 Dashboard — *Resumen*

- **6 KPI stat cards** at a glance: Capital Invertido, Valor de Inventario, Cobrado Entregado, Presupuestado, Balance, Tareas Pendientes
- **Upcoming deliveries** — next 5 tasks sorted by due date
- **Recent budgets** — last 4 budgets with photo thumbnails

### 💰 Investment Tracking — *Inversión*

- Register capital injections with amount + notes
- Auto-calculated running total
- Timestamped history with delete capability

### 📦 Inventory Management — *Inventario*

- Full CRUD for materials and parts
- Fields: name, category, quantity, unit cost, photo
- **Total stock value** auto-calculated
- **Search & filter** by name or category
- Grid layout with card-style items
- **Photo capture** via device camera (`capture="environment"`) or gallery upload
- **Client-side image compression** (canvas resize to 1200px max, JPEG 82% quality) to stay within localStorage quota

### 📋 Budgets & Quotes — *Presupuestos*

- Full CRUD for project budgets
- Fields: client, project, estimated investment, amount to charge, delivery date, status (Pending / Delivered), notes, photo
- **Margin calculation** (ingreso - inversion)
- **Visual status badges** with color-coded due-date indicators
- Toggle between Pending / Delivered with one click

### ✅ Task Management — *Tareas*

- Full CRUD for workshop tasks
- Fields: title, project, assignee, priority (Alta / Media / Baja), status (Pending / In Progress / Completed), due date, notes
- **Smart sort mode**: overdue → due today → due soon (3 days) → no urgency, then by priority, then by date
- **Manual drag-and-drop** reordering (toggle with a switch)
- **Color-coded priority chips** (red=Alta, amber=Media, green=Baja)
- **Due-date badges** (red=overdue, amber=today, yellow=soon, gray=ok)
- **One-click status cycling** — click the status dot to cycle through Pending → In Progress → Completed

### 🎨 Cross-Cutting

| Feature | Implementation |
|---|---|
| **Offline-first** | 100% client-side, all data in `localStorage` |
| **Tablet-optimized** | `min-height: 3rem` touch targets, bottom nav bar, large fonts |
| **Responsive** | Tab navigation on desktop, bottom nav bar on mobile/tablet portrait |
| **Image upload** | Camera (with `capture="environment"`) or gallery, with auto-compression |
| **Currency** | Mexican Peso (MXN) locale formatting |
| **Spanish UI** | Full Spanish localization for workshop workers |
| **Unique IDs** | Simple `Math.random().toString(36).slice(2, 8)` — sufficient for local-only data |
| **Persistent state** | Custom `useLocal<T>()` hook syncs React state with `localStorage` seamlessly |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | [TanStack React Start](https://tanstack.com/start/latest) | Full-stack React with SSR, file-based routing, and Nitro server engine |
| **UI Library** | [React 19](https://react.dev) | Latest concurrent features, server components |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org) | Strict type safety across the entire codebase |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) | Utility-first, zero-runtime CSS with the new CSS-first configuration |
| **Build Tool** | [Vite 8](https://vite.dev) | Lightning-fast HMR and optimized production builds |
| **Package Manager** | [Bun](https://bun.sh) | Blazing fast installs and native TypeScript execution |
| **Routing** | [TanStack React Router](https://tanstack.com/router/latest) | File-based routing with auto-generated route tree |
| **Server Engine** | [Nitro](https://nitro.unjs.io) | Cross-platform server runtime (used by TanStack Start for SSR) |
| **UI Components** | [Radix UI](https://www.radix-ui.com) + [shadcn/ui](https://ui.shadcn.com) | Accessible, unstyled headless primitives with beautiful defaults |
| **Icons** | [Lucide React](https://lucide.dev) | Consistent, crisp SVG icons |
| **Charts** | [Recharts](https://recharts.org) | Composable charting built on D3 |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | Performant forms with schema-based validation |
| **Date Handling** | [date-fns](https://date-fns.org) | Tree-shakable date utilities |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski) | Lightweight toast notifications |
| **Drag & Drop** | Native HTML5 DnD | Vanilla drag-and-drop for task reordering (zero-dependency) |
| **Animations** | [tw-animate-css](https://github.com/innocenzi/tw-animate-css) | Tailwind-compatible animation utilities |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   TanStack Start App                      │
│       (SSR + Client Hydration via Nitro + Vite)           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  src/                                                     │
│   ├── routes/index.tsx     ← Single-page app (860 LoC)   │
│   ├── routes/__root.tsx    ← Root layout + ErrorBoundary │
│   ├── components/ui/       ← 41 shadcn/ui components     │
│   ├── lib/                 ← Error handling & utils      │
│   ├── hooks/               ← Custom React hooks          │
│   ├── styles.css           ← Tailwind v4 + custom theme  │
│   ├── router.tsx           ← Router factory              │
│   ├── server.ts            ← SSR entry point             │
│   └── start.ts             ← TanStack Start instance     │
│                                                          │
│  Data: localStorage (zero backend, zero API)             │
│  State: React useState + custom useLocal<T>() hook      │
│  Routing: TanStack React Router (file-based)             │
│  Styling: Tailwind CSS v4 + CSS custom properties        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Key Decisions

- **Zero Backend**: All CRUD operations happen against `localStorage` via a `useLocal<T>()` hook. No server, no API, no database. Perfect for a workshop with limited connectivity.
- **SSR for Performance**: TanStack Start provides server-side rendering on first load for fast initial paints and SEO, then hydrates into a full SPA.
- **Tablet-First Design**: The entire UI is built for portrait tablet use — large touch targets (`min-height: 3rem`), thumb-friendly bottom nav, 1rem font sizes. Desktop is secondary.
- **Image Compression**: Photos taken with the device camera are resized client-side (canvas, max 1200px, 82% JPEG quality) to fit within `localStorage`'s ~5–10 MB quota.
- **Error Resilience**: Multi-layer error handling — global event listeners, SSR error page, React Error Boundary, and a pluggable error reporting hook.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.2

### Install

```bash
bun install
```

### Development

```bash
bun dev
```

Opens at `http://localhost:3000` with hot module replacement.

### Build

```bash
bun run build
```

### Preview Production Build

```bash
bun run preview
```

### Lint & Format

```bash
bun run lint
bun run format
```

---

## Project Structure

```
src/
├── components/
│   └── ui/              # shadcn/ui primitives (Button, Card, Dialog, etc.)
├── hooks/
│   └── use-mobile.tsx   # Mobile detection hook
├── lib/
│   ├── error-capture.ts     # Global error event listeners
│   ├── error-page.ts        # SSR error HTML renderer
│   ├── error-reporting.ts   # Pluggable error reporting
│   └── utils.ts             # cn() utility (clsx + tailwind-merge)
├── routes/
│   ├── __root.tsx       # Root layout, nav shell, error/404
│   └── index.tsx        # Main application (all 5 tabs)
├── router.tsx           # TanStack Router factory
├── routeTree.gen.ts     # Auto-generated route tree
├── server.ts            # SSR entry (error-wrapped)
├── start.ts             # TanStack Start instance
└── styles.css           # Tailwind v4 + custom theme
```

---

## Theme

A warm, artisanal palette inspired by woodworking:

| Token | Value |
|---|---|
| `--color-primary` | Walnut brown |
| `--color-accent` | Amber / gold |
| `--color-background` | Warm cream |
| `--color-sidebar` | Deep wood tone |
| Custom effects | Wood grain texture overlay, warm shadows |

Built with **OKLCH** color space for consistent perceptual brightness.

---

## Why This Project Stands Out

- **Real-world problem, real solution** — built for an actual operating carpentry workshop, not a toy demo
- **Modern tech stack** — React 19 + TanStack Start + Vite 8 + Bun + Tailwind v4 (cutting-edge as of 2026)
- **Thoughtful architecture** — SSR for performance, localStorage for zero-infrastructure offline use, tablet-first UX
- **Clean codebase** — TypeScript throughout, shadcn/ui component pattern, Zod-validated forms, single-responsibility hooks
- **Production-ready error handling** — SSR error pages, React Error Boundaries, global error capture, unhandled rejection handling

---

## License

Private — all rights reserved.

---

<p align="center">
  Crafted with ❤️ for the workshop floor.
</p>
