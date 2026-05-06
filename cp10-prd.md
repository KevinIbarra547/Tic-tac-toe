# CP10 Mini-PRD: Visual redesign + game replay

## What I'm building
Two related deliverables in one checkpoint: (1) a full visual redesign of the app — dark mode, electric green accent, unified settings panel, motion polish — and (2) a game replay feature that lets the player watch any past game from their history play out move-by-move.

## Why this matters
The app's functionality has been complete since CP08 but the visual feedback was minimal — gray on white, no motion, dropdowns scattered around the page. Real users (the teacher, classmates) will spend more time looking at the UI than reading my code, so polish carries weight on its own. The redesign turns "a working tic-tac-toe app" into "a tic-tac-toe app I'd actually want to play."

The game replay feature builds on existing data — every saved game records the final board, the result, the winner, the player's letter, the AI difficulty/personality. With that data we can reconstruct the move sequence (the order X and O were placed) and show the game playing out. This makes "your game history" actually useful to look at instead of just a list of dates.

## How it works (user-facing)

### Visual redesign
- Dark theme: deep background (#0f1117), surface (#181b23), text (#e6e8ee), muted text (#6b6f7a), border (#2a2d35)
- Single accent color: electric green (#4ade80) for the player's X marks, primary buttons, success states, and the AI comment border
- "Game Settings" panel: a single bordered container above the board groups all four selectors (mode, letter, difficulty, personality) into a labeled grid layout
- Subtle motion: AI's mark fades in over 200ms after Groq responds; AI thinking shows a small "thinking…" indicator with animated dots; winning line highlights with green glow when game ends
- Consistent nav bar across all 3 pages
- Same color system applied to leaderboard tables and checkpoint cards

### Game replay
1. In the game history list, each completed game becomes clickable (cursor pointer, hover effect).
2. Clicking opens a modal overlay (centered on screen, dark backdrop).
3. The modal shows: game metadata (mode, difficulty, personality, who won, date), an empty 3x3 board, "Move 0 of N" text, and three buttons: ← Prev, Auto-play, Next →.
4. Player clicks Next to advance one move. The corresponding cell fills in. Move counter updates.
5. Player clicks Auto-play to step through all moves at 800ms per move. Auto-play button toggles to "Pause" while running.
6. Player clicks Prev to step backward.
7. Player clicks the X close button (top right of modal) or the dark backdrop to close.

### How move sequence is reconstructed
For games saved after the CP10 follow-up fix: each game record includes a `moveOrder` array capturing every move in exact click order. Replay uses this directly for a true reconstruction.

For games saved before that fix (legacy records without `moveOrder`): replay falls back to reconstructing from the final board by interleaving X cells and O cells in left-to-right top-to-bottom order. The final board state is accurate, but the path to get there is approximated. This is a known limitation only for legacy games.

## How it works (technical)
- Frontend: replay state (`replayMoves`, `currentMoveIndex`, `autoplayInterval`) is module-scoped. `openReplay(game)` reconstructs moves from `game.board`, renders the modal board, and wires up Prev/Next/Auto-play.
- Closing the modal (button or backdrop click) clears the autoplay interval and removes the `open` CSS class.
- All new behavior added to `main.js`. No new server routes needed — replay runs purely on the history data already fetched by `loadHistory()`.

## Out of scope
- Light mode toggle
- Sound effects
- Custom fonts (system stack stays)
- Replay export / share
- Mobile-specific breakpoints
