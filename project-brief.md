# Tic Tac Toe AI: Project Brief

## What I'm building
A Tic Tac Toe web app with accounts, AI opponents, and a stats page.

## Required tech stack (HARD CONSTRAINTS)
- Node.js 20+
- Express for the server
- Vanilla HTML, CSS, JavaScript for the frontend. NO frameworks, NO build tools, NO TypeScript, NO React, NO Tailwind.
- JSON files for ALL data storage. No database.
- Allowed packages only: express, dotenv, express-session, nodemon, groq-sdk (later).

## Required file structure
- /data — ALL JSON data lives here
- /public — ALL browser-facing files live here
- server.js at the root — Express entry point, npm start runs it
- .env — never committed, holds secrets

## Required .gitignore minimum
- node_modules/
- .env
- data/users.json
- data/games.json

## Security
- Passwords stored in PLAINTEXT in users.json (learning project, do NOT hash)
- Groq API key in .env, never commit

## Checkpoints (each is a tagged commit on main)
- CP01-world: server runs, hello world route, README, .gitignore — DONE
- CP02-accounts: signup, login, logout, users.json writes correctly — IN PROGRESS
- CP03-game: 3x3 grid renders, cells respond to clicks, turn indicator
- CP04-pvp: human vs human, win/draw detection
- CP05-save: finished games append to games.json
- CP06-ai: Groq wired up, PvP/PvAI toggle, AI plays legal moves
- CP07-levels: 3 difficulties, 3 personalities, AI returns {move, comment} JSON
- CP08-stats: leaderboard, AI win rate by difficulty/personality
- CP09-c1: custom feature 1 with mini-PRD
- CP10-c2: custom feature 2 with mini-PRD

## Grading
- 30% checkpoints tagged in GitHub correctly
- 30% Checkpoints page reflections (specific, honest, thoughtful)
- 30% custom features CP09 and CP10
- 10% app functionality

## Hard rules
- Never rename required files
- Never move JSON outside /data
- Never move browser files outside /public
- Never add a framework
- Run git status before every commit
- If a key is committed, rotate immediately
