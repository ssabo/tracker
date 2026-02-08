# Infusion Site Tracker

A React TypeScript application for diabetes management that helps users track injection site rotation and usage history. This tool assists people with diabetes who need to rotate their insulin infusion sites to prevent lipodystrophy and maintain optimal absorption.

## Features

- **Site Management**: Add and organize injection sites by body location with left/right side tracking
- **Usage Tracking**: Record when each site is used with one-tap logging
- **Smart Priority Ranking**: Color-coded recommendations — green for sites due for use, red for recently used sites — to encourage healthy rotation
- **Site Suspension**: Temporarily suspend sites that need recovery time, with preset durations (3 days to 2 months), indefinite suspension, or custom durations
- **Usage History**: View complete history grouped by date with relative timestamps, plus inline editing and deletion
- **Data Export/Import**: Back up all data as JSON and restore from backups
- **Local Storage**: All data persists locally in your browser — no account or server required
- **Mobile-Friendly**: Responsive design with touch-friendly controls

## Tech Stack

- **React 19** with TypeScript (strict mode)
- **Create React App** toolchain
- **localStorage** for persistence (no backend)
- **React Testing Library** + **Jest** for tests
- **gh-pages** for deployment

## Getting Started

```bash
npm install
npm start
```

The app opens at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run development server |
| `npm test` | Run tests in watch mode |
| `npm run build` | Build for production |
| `npm run deploy` | Deploy to GitHub Pages |

## Project Structure

```
src/
├── components/
│   ├── UsageTracker.tsx        # Main tracking UI with priority ranking
│   ├── UsageTracker.test.tsx
│   ├── LocationManager.tsx     # Site CRUD and suspension management
│   ├── LocationManager.test.tsx
│   └── UsageHistory.tsx        # History timeline with export/import
├── utils/
│   ├── storage.ts              # localStorage API for all data operations
│   └── storage.test.ts
├── types.ts                    # TypeScript interfaces
├── App.tsx                     # Navigation shell
└── App.test.tsx
```

## License

GPL-3.0
