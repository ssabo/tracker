# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- `npm start` - Run development server (opens at http://localhost:3000)
- `npm test` - Run tests in watch mode
- `npm run build` - Build for production
- `npm run deploy` - Deploy to GitHub Pages via gh-pages
- `npm run test -- --coverage` - Run tests with coverage report
- `npm run test -- --watchAll=false` - Run tests once without watch mode

## Architecture Overview

This is a React 19 + TypeScript application (bootstrapped with Create React App) for tracking diabetes infusion site usage. The app helps users manage injection sites, track rotation schedules, and suspend sites that need recovery time.

### Core Data Model (`src/types.ts`)
- **Suspension**: Optional per-site suspension with `suspendedAt` timestamp and `resumeAt` (number for timed, `null` for indefinite)
- **InfusionSite**: Body location with `name`, `side` (left/right), and optional `suspension`
- **UsageRecord**: Tracks site usage with `siteId` and `timestamp`
- **AppData**: Top-level container holding `sites[]` and `usageHistory[]`

### State Management
- Uses localStorage (key: `infusion-site-tracker`) for persistence via `utils/storage.ts`
- No external state management library — components call storage functions directly and reload local state
- All data operations go through storage utility functions with try-catch error handling

### Component Structure (`src/components/`)
- **App.tsx**: Main shell with tab navigation between three views (track, manage, history)
- **UsageTracker**: Primary interface for recording site usage. Calculates days-since-last-use per site and assigns a priority ranking (green/high, gray/medium, red/low). Suspended sites are displayed but not selectable.
- **LocationManager**: CRUD for infusion sites plus suspension management. Supports preset durations (3 days, 2 weeks, 1 month, 2 months), indefinite suspension, and custom duration input.
- **UsageHistory**: Timeline grouped by date with relative timestamps. Supports inline editing of records, deletion, and JSON export/import of all app data with validation (`isValidAppData()`).

### Storage API (`src/utils/storage.ts`)
- **Data**: `loadData()`, `saveData(data)`
- **Sites**: `addSite(name, side)` (side can be `'both'`), `deleteSite(siteId)`, `groupSitesByName(sites)`
- **Usage**: `recordUsage(siteId)`, `getUsageHistory()`, `deleteUsageRecord(recordId)`, `updateUsageRecord(recordId, newSiteId, newTimestamp)`
- **Suspension**: `suspendSite(siteId, durationMs)` (`null` = indefinite), `unsuspendSite(siteId)`, `isSiteSuspended(site)` (auto-clears expired suspensions)

### Testing (`*.test.ts` / `*.test.tsx`)
Tests use React Testing Library and Jest. Key test areas:
- `storage.test.ts` — Suspension logic: timed/indefinite suspend, unsuspend, auto-expiration, backward compatibility with legacy data
- `UsageTracker.test.tsx` — Suspended sites render correctly, priority ranking excludes suspended sites
- `LocationManager.test.tsx` — Suspend/resume UI, duration picker, preset and custom durations, independent left/right suspension
- `App.test.tsx` — Smoke test for header rendering

### UI Patterns
- Inline styles throughout (no CSS modules or styled-components)
- Responsive layout with max-width 600px, flexbox, and `clamp()` font sizing
- Color-coded priority: green (#28a745) = high priority, red (#dc3545) = low priority, ice-blue (#d1ecf1) = suspended
- Minimum 44px touch targets for mobile accessibility
- Visual left/right site selection with grouped display by site name
