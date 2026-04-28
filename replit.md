# Tic Tac Toe AI

## Overview

Class project. CP01-world checkpoint: minimal vanilla JS Express scaffolding only.

## Stack

- **Runtime**: Node.js 20+
- **Backend**: Express
- **Frontend**: vanilla HTML/CSS/JS in `/public`
- **Storage**: JSON files in `/data` (no database)
- **Package manager**: npm

## Allowed packages

- Runtime: `express`, `dotenv`, `express-session`
- Dev: `nodemon`

`groq-sdk` is intentionally NOT installed yet. Do not add other packages without explicit user approval.

## Structure

```
.
├── .env                # empty (gitignored)
├── .env.example        # empty
├── .gitignore          # 4 lines: node_modules/, .env, data/users.json, data/games.json
├── README.md
├── package.json
├── server.js           # Express entry (binds 0.0.0.0:PORT||5000)
├── data/
│   ├── users.json      # []
│   └── games.json      # []
└── public/
    ├── index.html      # Hello World
    ├── styles.css      # empty
    └── main.js         # empty
```

## Commands

- `npm run dev` — run with nodemon (used by the configured workflow)
- `npm start` — run with node

## Hard constraints (do not violate)

- Vanilla JS only — no TypeScript, React, Vite, bundlers, frameworks
- No database — JSON files in `/data` only
- No `/routes`, `/lib`, `/views` folders
- No extra middleware, routes, or packages without user approval
- Never commit `.env`, `data/users.json`, `data/games.json`
