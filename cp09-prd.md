# CP09 Mini-PRD: Player picks X or O

## What I'm building
A feature that lets the player choose to play as X or O before each game. The AI plays the other letter. Whoever has X goes first.

## Why this matters
Real tic-tac-toe doesn't dictate who plays X — usually the players decide, often with X going to whoever wants to go first. The current app forces the player to be X every time, which removes a meaningful choice. Letting the player pick O introduces a real strategic decision: do you want to play first (X) or react to the AI's opening (O)?

This also retroactively fixes a known limitation in CP08's leaderboard: game records didn't track which letter the player chose, so PvP win attribution was guessed (assuming saver was always X). With playerLetter saved on every game record, leaderboard wins can be correctly attributed.

## How it works (user-facing)
1. A dropdown labeled "Play as:" appears in the game options area, visible whether playing PvP or PvAI. Default is X.
2. Player picks X or O. The mode toggle, difficulty, and personality dropdowns work alongside it.
3. Player clicks "New game" — board resets, current turn shows X (because X always goes first).
4. If player picked O AND mode is PvAI, AI plays its first move automatically. The board lock prevents player clicks until AI finishes.
5. Player makes moves only as their chosen letter. AI makes moves only as its assigned letter.
6. Win/draw detection works as before — winning lines just match the letter that completed them.
7. Game saves to history with `playerLetter` recorded. Leaderboard correctly attributes the result.

## How it works (technical)
- Frontend: `playerLetter` is a JS variable that the dropdown sets. `aiLetter` is computed as the opposite. `newGame()` checks if `mode === 'pvai' && aiLetter() === 'X'` and triggers `aiTurn()` automatically.
- Backend: `/ai-move` accepts a new field `aiLetter` ('X' or 'O') in the request body. The Groq prompt and the hard-mode tactical override use this letter instead of hardcoded 'O'/'X'.
- `/games` POST accepts `playerLetter` and stores it. `/leaderboard` uses `playerLetter` to attribute wins correctly.

## Out of scope
- Animating the letter swap or board reset
- Letting the player change their letter mid-game (only between games)
- Tracking stats by letter (e.g. "X-as-player win rate vs O-as-player win rate") — could be a future feature
- Changing the visual styling of the selector — that's CP10's design pass
- Game replay feature (CP10)
