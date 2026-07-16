# TurnUp.io

**Real-Time Multiplayer Board Game Platform** — A full-stack web application enabling players to compete in classic board games (Snakes & Ladders, Ludo, Uno, Monopoly) via a persistent WebSocket connection. Built with a React/TypeScript frontend and a Node.js/Express backend, backed by PostgreSQL managed through Prisma ORM.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Repository Structure](#repository-structure)
- [Setup and Installation](#setup-and-installation)
- [Running the Project](#running-the-project)
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
├── assets/                     # Brand resources and design assets
├── research/                   # Technical research and design documents
├── package.json                # Root-level scripts to orchestrate client + server
└── README.md                   # Project documentation
```

---

## Setup and Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [PostgreSQL](https://www.postgresql.org/) instance (local or remote)
- npm (bundled with Node.js)

### 1. Clone the Repository

```bash
git clone https://github.com/Sufyan-Farooq/TurnUp.io.git
cd TurnUp.io
```

### 2. Configure Environment Variables

Create a `.env` file inside the `server/` directory with the following keys:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/turnup_db?schema=public"

# Secret key for signing JSON Web Tokens
JWT_SECRET="your_jwt_secret_key"

# Port the server listens on
PORT=5000
```

### 3. Install Dependencies

Install dependencies for both the backend and frontend separately:

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

### 4. Initialize the Database

Push the Prisma schema to your PostgreSQL database to create all required tables:

```bash
cd server
npx prisma db push
```

---

## Running the Project

Run both applications from the root directory using the convenience scripts:

```bash
# Start the backend server (hot-reload via Nodemon)
# Available at: http://localhost:5000
npm run dev:server

# Start the frontend dev server (HMR via Vite)
# Available at: http://localhost:5173
npm run dev:client
```

Both commands can be run simultaneously in separate terminal windows.

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
| `PORT` | No | HTTP port for the Express server (default: `5000`) |
