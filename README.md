# TurnUp.io 🎲

TurnUp.io is a real-time, web-based multiplayer board game platform. Play classic games like Snakes & Ladders, Ludo, Uno, and Monopoly with friends in real-time.

---

## 🚀 Features

- **Multiplayer Lobby & Matchmaking**: Create public or private rooms, invite players, and start matches.
- **Multiple Game Modes**:
  - 🐍 **Snakes & Ladders**
  - 🎲 **Ludo**
  - 🃏 **Uno**
  - 🎩 **Monopoly**
- **Real-Time Gameplay**: Low-latency, bi-directional event communication using WebSockets.
- **User Authentication**: Standard user accounts and guest access options.
- **Player Stats & Leaderboards**: Tracks games played, matches won, and scores across all supported game types.

---

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vite.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **WebSockets**: [Socket.io-client](https://socket.io/)
- **Linter**: [Oxlint](https://github.com/oxc-project/oxc)

### Backend (Server)
- **Framework**: [Express](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Auth**: JWT (JSON Web Tokens)

---

## 📁 Repository Structure

```text
TurnUp.io/
├── client/              # React + Vite frontend application
│   ├── src/             # Application source code
│   └── package.json     # Frontend dependencies and scripts
├── server/              # Express + Socket.io backend server
│   ├── src/             # Server source code (API, game engines, services)
│   ├── prisma/          # Database schema and migrations
│   └── package.json     # Backend dependencies and scripts
├── assets/              # Brand resources, images, or documentation
├── research/            # Technical research and design documents
├── package.json         # Root scripts to run both apps
└── README.md            # Project documentation
```

---

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) database

### 1. Clone the repository
```bash
git clone https://github.com/Sufyan-Farooq/TurnUp.io.git
cd TurnUp.io
```

### 2. Configure Environment Variables
Create a `.env` file inside the `server/` directory:
```env
# Database connection string
DATABASE_URL="postgresql://username:password@localhost:5432/turnup_db?schema=public"

# JSON Web Token secret key
JWT_SECRET="your_jwt_secret_key"

# Server Port
PORT=5000
```

### 3. Install Dependencies
Install dependencies for both the client and server:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Setup Database Schema
Initialize database schemas and seed database structure using Prisma:
```bash
cd ../server
npx prisma db push
```

---

## 🚀 Running the Project

You can run both parts from the root directory using the root scripts:

### Run Server (Dev Mode)
```bash
npm run dev:server
```
Runs on `http://localhost:5000` with hot-reloading via Nodemon.

### Run Client (Dev Mode)
```bash
npm run dev:client
```
Runs on `http://localhost:5173` via Vite.

---

## 📊 Database Schema Overview

The database uses PostgreSQL and is mapped using Prisma. Major models include:

- **User**: Represents registered accounts and guests. Stores user configuration, roles (USER, GUEST, ADMIN), and auth credentials.
- **MatchHistory**: Log of all matches created, current playing status, and outcomes.
- **MatchPlayer**: Relation table linking users to matches, keeping track of scores and rankings in real-time.
- **GameStat**: Keeps track of win/loss statistics and cumulative score points for leaderboard ranking.
