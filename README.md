# TurnUp.io

**Real-Time Multiplayer Board Game Platform** — A full-stack web application enabling players to compete in classic board games (Snakes & Ladders, Ludo, Uno, Monopoly) via a persistent WebSocket connection. Built with a React/TypeScript frontend and a Node.js/Express backend, backed by PostgreSQL managed through Prisma ORM.

[![Watch the TurnUp.io launch video](./remotion-demo/out/preview.png)](./remotion-demo/out/turnup-demo.mp4)

A 27-second launch video featuring real captures of the TurnUp site, room setup, and live Ludo, UNO, Monopoly, and Snakes & Ladders matches. [Watch the launch video](./remotion-demo/out/turnup-demo.mp4) or follow the instructions below to open and render the Remotion composition.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Repository Structure](#repository-structure)
- [Setup and Installation](#setup-and-installation)
- [Running the Project](#running-the-project)
- [Remotion product demo](#remotion-product-demo)
- [Container deployment](#container-deployment)
- [Kubernetes deployment](#kubernetes-deployment)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)

---

## Features

- **Real-Time Multiplayer Gameplay** — Bi-directional, low-latency event communication using Socket.io WebSockets; game state is synchronized across all clients on every turn.
- **Multiple Game Modes** — Four fully implemented game engines: Snakes & Ladders, Ludo, Uno, and Monopoly, each with dedicated server-side logic.
- **Lobby and Matchmaking System** — Players can create public or private rooms, share invite codes, and start matches when ready.
- **User Authentication** — JWT-based stateless authentication supporting registered user accounts and anonymous guest access.
- **Player Statistics and Leaderboards** — Persistent tracking of games played, wins, losses, and cumulative score points per game type, surfaced via a leaderboard.
- **Role-Based Access Control** — Three-tier role system (USER, GUEST, ADMIN) enforced at the API and game-room level.

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI component library and state management |
| TypeScript | ~6.0 | Static typing across the entire client |
| Vite | 8 | Development server and production bundler |
| Socket.io-client | 4.x | WebSocket client for real-time game events |
| Oxlint | 1.x | Fast, Rust-based JavaScript/TypeScript linter |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express | 4.x | HTTP server and REST API routing |
| TypeScript | 5.x | Static typing across the entire server |
| Socket.io | 4.x | WebSocket server for event-driven game logic |
| Prisma ORM | 7.x | Type-safe database access and schema migrations |
| PostgreSQL | — | Relational database for users, matches, and stats |
| JSON Web Tokens (JWT) | 9.x | Stateless user authentication |
| Nodemon | 3.x | Hot-reload during development |

---

## Architecture Overview

```
Client (React + Vite)
    │
    ├── REST API (HTTP/JSON)  ─────► Express Router  ─► Prisma ORM  ─► PostgreSQL
    │
    └── WebSocket (Socket.io) ─────► Socket.io Server ─► Game Engine (per game type)
                                                              ├── snakesLadders.ts
                                                              ├── ludo.ts
                                                              ├── uno.ts
                                                              └── monopoly.ts
```

The backend is a single Node.js process running both the Express REST API and the Socket.io WebSocket server on the same port. Each game session is managed in memory by the corresponding game engine module and persisted to PostgreSQL at the end of each match.

---

## Repository Structure

```text
TurnUp.io/
├── client/                     # React + Vite frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components (BoardWrapper, etc.)
│   │   ├── services/           # Client-side API and socket service modules
│   │   ├── App.tsx             # Root component and client-side routing
│   │   ├── index.css           # Global styles and design tokens
│   │   └── main.tsx            # Application entry point
│   ├── index.html              # HTML shell
│   ├── vite.config.ts          # Vite build configuration
│   └── package.json            # Frontend dependencies and scripts
│
├── server/                     # Express + Socket.io backend
│   ├── src/
│   │   ├── engine/             # Game engine logic (one file per game)
│   │   │   ├── interfaces.ts   # Shared TypeScript interfaces for game state
│   │   │   ├── snakesLadders.ts
│   │   │   ├── ludo.ts
│   │   │   ├── uno.ts
│   │   │   ├── monopoly.ts
│   │   │   ├── rng.ts          # Seeded random number generation
│   │   │   └── simulation.ts   # Game simulation and turn resolution
│   │   ├── services/
│   │   │   └── auth.ts         # JWT generation and verification
│   │   ├── db.ts               # Prisma client singleton
│   │   └── server.ts           # Main server entry point (Express + Socket.io)
│   ├── prisma/
│   │   └── schema.prisma       # Database schema and model definitions
│   └── package.json            # Backend dependencies and scripts
│
├── remotion-demo/              # Remotion launch video and real site captures
│   ├── public/footage/         # Captures of the app and live matches
│   ├── src/                    # Composition and motion design
│   └── out/                    # Rendered MP4 and README poster image
├── assets/                     # Brand resources and design assets
├── research/                   # Technical research and design documents
├── package.json                # Root-level scripts to orchestrate client + server
└── README.md                   # Project documentation
```

---

## Setup and Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher
- [PostgreSQL](https://www.postgresql.org/) instance (local or remote)
- npm (bundled with Node.js)

### 1. Clone the Repository

```bash
git clone https://github.com/Sufyan-Farooq/TurnUp.io.git
cd TurnUp.io
```

### 2. Configure Environment Variables

For local development, create `server/.env` with a PostgreSQL connection string and a JWT signing secret:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/turnup_db?schema=public"

# Secret key for signing JSON Web Tokens
JWT_SECRET="your_jwt_secret_key"

# Optional; defaults to 3000
PORT=3000

# Optional; defaults to the local Vite origin
CORS_ORIGIN="http://localhost:5173"
```

### 3. Install Dependencies

Install dependencies for the backend and frontend:

```bash
# Backend dependencies (from the repository root)
npm install --prefix server

# Frontend dependencies
npm install --prefix client
```

### 4. Initialize the Database

Push the Prisma schema to your PostgreSQL database to create all required tables:

```bash
cd server
npx prisma db push
```

---

## Running the Project

Run each application from the repository root in its own terminal. The backend is available at `http://localhost:3000`; the Vite client is at `http://localhost:5173`.

```bash
# Start the backend server (hot-reload via Nodemon)
# Available at: http://localhost:5000
npm run dev:server

# Start the frontend dev server (HMR via Vite)
# Available at: http://localhost:5173
npm run dev:client
```

Both commands can be run simultaneously in separate terminal windows.

## Remotion product demo

The Remotion project lives in [`remotion-demo/`](./remotion-demo/). It uses full-resolution captures of the running product in `remotion-demo/public/footage/`, with matching in-game sound cues. The rendered MP4 and its poster frame are included in [`remotion-demo/out/`](./remotion-demo/out/).

```bash
# Open the composition in Remotion Studio
npm install --prefix remotion-demo
npm run demo:studio

# Render the 27-second, 1920 × 1080, 30 fps launch video
npm run demo:render
```

The film moves from the live landing page through the game picker and room setup, then into actual multiplayer game screens before closing on the TurnUp brand. The match footage was captured from local demo rooms filled with the product's built-in bots.

## Container deployment

The repository includes production multi-stage images for the React client and
Node server plus PostgreSQL orchestration. The client serves the application
and reverse-proxies `/api` and `/socket.io` to the server, so browsers only
need one public origin.

```bash
cp .env.example .env
# Set a long, random JWT_SECRET in .env before starting.
docker compose up --build
```

Open `http://localhost:8080`. REST and WebSocket traffic are served through
that same origin; the server port remains private to the Compose network.
PostgreSQL data is retained in the `postgres-data` volume.

## Kubernetes deployment

The live Oracle deployment uses GitHub Actions and Docker Compose. See [Oracle CI/CD setup](deploy/oracle/README.md) for deployment, health checks, backups, and rollback.

[`deployment.yml`](./deployment.yml) contains PostgreSQL, server, client,
Services, probes, resource bounds, persistent storage, and an nginx Ingress.
Before applying it:

1. Publish the client and server images and update both `image:` values.
2. Replace `turnup.example.com` in the Ingress and `CORS_ORIGIN` ConfigMap.
3. Create the required secret without committing credentials:

```bash
kubectl create namespace turnup --dry-run=client -o yaml | kubectl apply -f -
kubectl -n turnup create secret generic turnup-secrets \
  --from-literal=postgres-password='replace-me' \
  --from-literal=jwt-secret='replace-with-a-long-random-value' \
  --from-literal=database-url='postgresql://turnup:replace-me@postgres:5432/turnup_db?schema=public'
kubectl apply -f deployment.yml
```

The game server intentionally runs as one replica because active rooms are
held in process memory. Horizontal scaling requires a shared room store and a
Socket.IO adapter such as Redis first.

---

## Database Schema

The database is defined using Prisma and targets PostgreSQL. The four core models are:

| Model | Description |
|---|---|
| `User` | Registered accounts and guest users. Stores credentials (bcrypt-hashed password), role, and timestamps. Indexed by `username`. |
| `MatchHistory` | A record of every game session. Tracks `gameType` (enum), `status` (CREATING / PLAYING / ENDED / ABANDONED), winner reference, and start/end timestamps. |
| `MatchPlayer` | Junction table linking users to matches. Stores per-player `score` and final `rank` for each match. Composite primary key on `(matchId, userId)`. |
| `GameStat` | Aggregated statistics per user per game type. Tracks `gamesPlayed`, `gamesWon`, and `totalPoints`. Unique constraint on `(userId, gameType)`. Indexed for leaderboard queries by `(gameType, gamesWon DESC)`. |

### Enums

- **`Role`**: `USER` | `GUEST` | `ADMIN`
- **`GameType`**: `SNAKES_LADDERS` | `LUDO` | `UNO` | `MONOPOLY`
- **`MatchStatus`**: `CREATING` | `PLAYING` | `ENDED` | `ABANDONED`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string in Prisma format |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWT tokens |
| `PORT` | No | HTTP port for the Express server (default: `3000`) |
| `CORS_ORIGIN` | No | Comma-separated browser origins allowed by the server (defaults to `http://localhost:5173`) |
