# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rocketmaster Dashboard is an internal support operations tool for eCarUp, an EV charging platform. It allows support staff to manage charging stations, drivers (users), RFID cards, car IDs, licenses, permissions, and active charging sessions. The backend API lives at ecarup.com; this is purely the frontend.

## Commands

- **Dev server:** `npm start` (runs `ng serve`, default port 4200)
- **Build:** `npm run build` (production) or `npm run watch` (dev with rebuild)
- **Format:** `npx prettier --write <file>`

No test runner is configured — all Angular schematics have `skipTests: true`.

## Architecture

Angular 21 standalone-component app using signals for state management, Tailwind CSS v4, and Lucide icons (tree-shaken, rendered via `IconComponent`).

### State & Data Flow

All backend data is loaded in a single bulk call via `SupportDataStore.loadAll()`, which fetches users, stations, RFID cards, car IDs, chargings, and permissions from `/api/rocketmaster/*` endpoints. The store exposes signal-based lookup maps (e.g. `userById`, `stationsByUserId`, `chargingsByStationId`) as `computed()` signals for O(1) access in components.

`AppConfigStore` holds a `readOnly` signal (currently unused but available for read-only mode).

### Auth

Basic auth via `AuthService` — credentials are base64-encoded and stored in `sessionStorage`. The `authInterceptor` attaches the `Authorization` header. Access requires the `access-rocketmaster-feature` feature flag on the user. A `bigIntInterceptor` handles large numeric IDs (16+ digits) by converting them to strings before JSON parsing.

### Routing

- `/login` — `LoginComponent` (unguarded)
- `/` — `ShellComponent` (sidebar + topbar + router-outlet, guarded by `authGuard`)
  - `/dashboard` — `HomeComponent` (stats + alerts)
  - `/station/:stationId` — `StationProfileComponent`
  - `/driver/:userId` — `DriverProfileComponent`

### Component Patterns

- All components use `ChangeDetectionStrategy.OnPush`
- Templates are inline (no separate `.html` files)
- Styles are mostly inline Tailwind classes + inline `[style.*]` bindings with the design system colors
- Components use Angular signal-based inputs (`input()`, `input.required()`) and `output()`
- `SearchService` provides client-side filtering over the already-loaded store data

### Design System Colors

- Primary blue: `#03A9F4`
- Text: `#000000` (headings), `#3B566B` (secondary)
- Borders: `#E2E8F0`
- Background: `#F4F4F4` (page), `#FFFFFF` (cards)
- Danger: `#DC2626`
- Success: `#059669`
- Warning: `#C55B00`
- Sidebar dark: `#0D2035`

### Environments

- `environment.ts` — dev, points to `https://www.ecarup.com`
- `environment.staging.ts` — staging, points to `https://staging.ecarup.com`
- `environment.production.ts` — production, points to `https://www.ecarup.com`

## Conventions

- Prettier: 100 char width, single quotes, angular parser for HTML
- TypeScript strict mode enabled with all Angular strict options
- API DTOs use PascalCase properties (matching the C# backend)
- Icon usage: import from `lucide` package and register in `IconComponent`'s `ICONS` map, then use `<app-icon name="..." />`
