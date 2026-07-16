# TurnUp.io — Client

React 19 + TypeScript + Vite frontend for the TurnUp.io real-time multiplayer board game platform.

## Overview

This package is the browser client for TurnUp.io. It connects to the backend server over both REST (HTTP/JSON) and WebSockets (Socket.io) to render and control real-time game sessions for Snakes & Ladders, Ludo, Uno, and Monopoly.

## Technology

| Technology | Version | Role |
|---|---|---|
| React | 19 | Component model and UI rendering |
| TypeScript | ~6.0 | Static typing |
| Vite | 8 | Dev server (HMR) and production bundler |
| Socket.io-client | 4.x | WebSocket communication with the game server |
| Oxlint | 1.x | Fast linter (Rust-based) |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR at `http://localhost:5173` |
| `npm run build` | Type-check and build the production bundle to `dist/` |
| `npm run lint` | Run Oxlint across the source files |
| `npm run preview` | Serve the production build locally for review |

## Project Structure

```text
client/
├── src/
│   ├── components/     # Shared UI components (e.g. BoardWrapper)
│   ├── services/       # Socket.io and REST API service modules
│   ├── App.tsx         # Root component and view routing
│   ├── index.css       # Global styles and design system tokens
│   └── main.tsx        # Application entry point
├── public/             # Static assets served as-is
├── index.html          # HTML entry shell
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies and scripts
```

## Development

From the repository root, run:

```bash
npm run dev:client
```

Or run directly inside this directory:

```bash
npm run dev
```

The dev server proxies are not configured here; ensure the backend server is running on `http://localhost:5000` for API and WebSocket connections to function.

## Linting

This project uses [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) for fast, zero-config linting. To enable type-aware lint rules, install `oxlint-tsgolint` and update `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```
