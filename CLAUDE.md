# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- `npm start` - Run development server (opens at http://localhost:3000)
- `npm test` - Run tests in watch mode
- `npm run build` - Build for production
- `npm run test -- --coverage` - Run tests with coverage report
- `npm run test -- --watchAll=false` - Run tests once without watch mode

## Architecture Overview

This is a React TypeScript application for tracking diabetes infusion site usage. The app helps users manage injection sites and track their rotation schedule.

### Core Data Model
- **InfusionSite**: Represents a body location with name and side (left/right)
- **UsageRecord**: Tracks when a site was used with timestamp
- **AppData**: Container for all application state

### State Management
- Uses localStorage for persistence via `utils/storage.ts`
- No external state management library - relies on React state and localStorage
- All data operations go through storage utility functions

### Component Structure
- **App.tsx**: Main navigation between three views (track, manage, history)
- **UsageTracker**: Primary interface for recording site usage with visual left/right selection
- **LocationManager**: CRUD operations for infusion sites
- **UsageHistory**: Historical view with edit/delete capabilities

### Storage Pattern
The storage layer provides a complete API:
- Site management: `addSite()`, `deleteSite()`
- Usage tracking: `recordUsage()`, `getUsageHistory()`
- Data operations: `loadData()`, `saveData()`

### UI Patterns
- Inline styles throughout (no CSS modules or styled-components)
- Visual left/right site selection with grouped display by site name
- Form-based interactions with immediate localStorage persistence