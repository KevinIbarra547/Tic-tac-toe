// --- game state ---
const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

let board = Array(9).fill('');
let currentTurn = 'X';
let gameOver = false;
let mode = 'pvp';
let aiThinking = false;
let playerLetter = 'X';

let moveOrder = [];

// --- replay state ---
let replayMoves = [];
let currentMoveIndex = 0;
let autoplayInterval = null;

function aiLetter() {
  return playerLetter === 'X' ? 'O' : 'X';
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function renderBoard() {
  document.querySelectorAll('#board .cell').forEach((cell, i) => {
    cell.textContent = board[i];
    cell.disabled = gameOver || board[i] !== '';
    cell.classList.toggle('player-mark', board[i] === playerLetter);
    cell.classList.remove('winning');
  });
}

function highlightWinningLine(winner) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] === winner && board[b] === winner && board[c] === winner) {
      [a, b, c].forEach(i => {
        document.querySelector(`#board .cell[data-index="${i}"]`).classList.add('winning');
      });
      break;
    }
  }
}

function updateModeButtons() {
  document.getElementById('mode-pvp').classList.toggle('active', mode === 'pvp');
  document.getElementById('mode-pvai').classList.toggle('active', mode === 'pvai');
  const settings = document.getElementById('game-settings');
  settings.classList.toggle('pvp-mode', mode === 'pvp');
}

function showAiThinking(visible) {
  document.getElementById('ai-thinking').style.display = visible ? 'block' : 'none';
}

function clearAiComment() {
  const el = document.getElementById('ai-comment');
  el.style.display = 'none';
  el.textContent = '';
}

function newGame() {
  board = Array(9).fill('');
  currentTurn = 'X';
  gameOver = false;
  aiThinking = false;
  moveOrder = [];
  renderBoard();
  document.getElementById('turn-indicator').textContent = 'Current turn: X';
  clearAiComment();
  showAiThinking(false);
  if (mode === 'pvai' && aiLetter() === 'X') aiTurn();
}

function makeMove(index) {
  if (gameOver || board[index] !== '') return;
  moveOrder.push({ index, mark: currentTurn });
  if (currentTurn === playerLetter) clearAiComment();
  board[index] = currentTurn;

  const winner = checkWinner(board);
  if (winner) {
    gameOver = true;
    renderBoard();
    highlightWinningLine(winner);
    document.getElementById('turn-indicator').textContent = `${winner} wins!`;
    saveGame(winner, 'win');
    return;
  }
  if (!board.includes('')) {
    gameOver = true;
    renderBoard();
    document.getElementById('turn-indicator').textContent = 'Draw';
    saveGame(null, 'draw');
    return;
  }
  currentTurn = currentTurn === 'X' ? 'O' : 'X';
  renderBoard();
  document.getElementById('turn-indicator').textContent = `Current turn: ${currentTurn}`;
  if (mode === 'pvai' && !gameOver && currentTurn === aiLetter()) aiTurn();
}

async function aiTurn() {
  aiThinking = true;
  showAiThinking(true);
  try {
    const difficulty = document.getElementById('difficulty').value;
    const personality = document.getElementById('personality').value;
    const res = await fetch('/ai-move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ board: board.slice(), difficulty, personality, aiLetter: aiLetter() })
    });
    if (!res.ok) {
      console.error('aiTurn: /ai-move returned', res.status);
      return;
    }
    const data = await res.json();
    const { move, comment } = data;
    if (typeof move !== 'number' || board[move] !== '') {
      console.error('aiTurn: invalid move from server:', move);
      return;
    }
    if (comment && typeof comment === 'string' && comment.trim()) {
      const el = document.getElementById('ai-comment');
      el.textContent = comment.trim();
      el.style.display = 'block';
    }
    makeMove(move);
    // fade-in animation on AI's cell
    const cell = document.querySelector(`#board .cell[data-index="${move}"]`);
    if (cell) {
      cell.classList.remove('fade-in');
      void cell.offsetWidth;
      cell.classList.add('fade-in');
    }
  } catch (err) {
    console.error('aiTurn failed:', err);
  } finally {
    aiThinking = false;
    showAiThinking(false);
  }
}

async function saveGame(winner, result) {
  try {
    const difficulty = mode === 'pvai' ? document.getElementById('difficulty').value : null;
    const personality = mode === 'pvai' ? document.getElementById('personality').value : null;
    await fetch('/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ winner, result, board: board.slice(), mode, difficulty, personality, playerLetter, moveOrder: moveOrder.slice() })
    });
    await loadHistory();
  } catch (err) {
    console.error('saveGame failed:', err);
  }
}

async function loadHistory() {
  try {
    const res = await fetch('/games', { headers: { ...authHeaders() } });
    if (!res.ok) return;
    const games = await res.json();
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    games.forEach(game => {
      const li = document.createElement('li');
      const when = new Date(game.timestamp).toLocaleString();
      let label = '';
      if (game.result === 'win') {
        const youWon = game.winner === (game.playerLetter || 'X');
        label = `${youWon ? 'You won' : 'AI won'} (${game.winner}) — ${when}`;
      } else {
        label = `Draw — ${when}`;
      }
      if (game.mode === 'pvai' && game.difficulty) {
        label += ` · ${game.difficulty}`;
      }
      li.textContent = label;
      li.addEventListener('click', () => openReplay(game));
      list.appendChild(li);
    });
  } catch (err) {
    console.error('loadHistory failed:', err);
  }
}

// --- replay ---
function buildReplayMoves(finalBoard) {
  const xCells = finalBoard.map((c, i) => c === 'X' ? i : -1).filter(i => i >= 0);
  const oCells = finalBoard.map((c, i) => c === 'O' ? i : -1).filter(i => i >= 0);
  const moves = [];
  const maxLen = Math.max(xCells.length, oCells.length);
  for (let i = 0; i < maxLen; i++) {
    if (xCells[i] !== undefined) moves.push({ index: xCells[i], mark: 'X' });
    if (oCells[i] !== undefined) moves.push({ index: oCells[i], mark: 'O' });
  }
  return moves;
}

function renderReplayBoard(pLetter) {
  const cells = document.querySelectorAll('#replay-board .cell');
  cells.forEach(c => {
    c.textContent = '';
    c.classList.remove('player-mark');
  });
  for (let i = 0; i < currentMoveIndex; i++) {
    const { index, mark } = replayMoves[i];
    const cell = document.querySelector(`#replay-board .cell[data-index="${index}"]`);
    if (cell) {
      cell.textContent = mark;
      cell.classList.toggle('player-mark', mark === pLetter);
    }
  }
  document.getElementById('replay-counter').textContent = `Move ${currentMoveIndex} of ${replayMoves.length}`;
  document.getElementById('replay-prev').disabled = currentMoveIndex === 0;
  document.getElementById('replay-next').disabled = currentMoveIndex >= replayMoves.length;
}

function openReplay(game) {
  replayMoves = (Array.isArray(game.moveOrder) && game.moveOrder.length > 0)
    ? game.moveOrder.slice()
    : buildReplayMoves(game.board);
  currentMoveIndex = 0;
  if (autoplayInterval) { clearInterval(autoplayInterval); autoplayInterval = null; }

  // Build meta string
  const pLetter = game.playerLetter || 'X';
  const parts = [];
  if (game.mode === 'pvai') {
    parts.push('vs AI');
    if (game.difficulty) parts.push(game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1));
    if (game.personality) parts.push(game.personality.charAt(0).toUpperCase() + game.personality.slice(1));
  } else {
    parts.push('vs Human');
  }
  if (game.result === 'draw') {
    parts.push('Draw');
  } else {
    const youWon = game.winner === pLetter;
    parts.push(youWon ? `You won as ${pLetter}` : `You lost as ${pLetter}`);
  }
  parts.push(new Date(game.timestamp).toLocaleDateString());
  document.getElementById('replay-meta').textContent = parts.join(' · ');

  // Build replay board cells
  const replayBoardEl = document.getElementById('replay-board');
  replayBoardEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.dataset.index = i;
    replayBoardEl.appendChild(btn);
  }

  renderReplayBoard(pLetter);

  // Button wiring (replace to avoid stale closures)
  const prevBtn = document.getElementById('replay-prev');
  const nextBtn = document.getElementById('replay-next');
  const autoBtn = document.getElementById('replay-auto');

  const newPrev = prevBtn.cloneNode(true);
  const newNext = nextBtn.cloneNode(true);
  const newAuto = autoBtn.cloneNode(true);
  prevBtn.replaceWith(newPrev);
  nextBtn.replaceWith(newNext);
  autoBtn.replaceWith(newAuto);

  newPrev.addEventListener('click', () => {
    if (currentMoveIndex > 0) { currentMoveIndex--; renderReplayBoard(pLetter); }
  });
  newNext.addEventListener('click', () => {
    if (currentMoveIndex < replayMoves.length) { currentMoveIndex++; renderReplayBoard(pLetter); }
  });
  newAuto.addEventListener('click', () => {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
      newAuto.textContent = 'Auto-play';
    } else {
      newAuto.textContent = 'Pause';
      autoplayInterval = setInterval(() => {
        if (currentMoveIndex < replayMoves.length) {
          currentMoveIndex++;
          renderReplayBoard(pLetter);
        } else {
          clearInterval(autoplayInterval);
          autoplayInterval = null;
          newAuto.textContent = 'Auto-play';
        }
      }, 800);
    }
  });

  document.getElementById('replay-modal').classList.add('open');
}

function closeReplay() {
  if (autoplayInterval) { clearInterval(autoplayInterval); autoplayInterval = null; }
  document.getElementById('replay-modal').classList.remove('open');
}

document.getElementById('replay-close').addEventListener('click', closeReplay);
document.getElementById('replay-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('replay-modal')) closeReplay();
});

// --- auth ---
async function refreshStatus() {
  const res = await fetch('/me', { headers: { ...authHeaders() } });
  const data = await res.json();
  const status = document.getElementById('status');
  const authForms = document.getElementById('auth-forms');
  const logoutBtn = document.getElementById('logout-button');
  const game = document.getElementById('game');

  if (data.loggedIn) {
    status.textContent = `Logged in as ${data.username}`;
    authForms.style.display = 'none';
    logoutBtn.style.display = '';
    game.style.display = '';
    updateModeButtons();
    newGame();
    loadHistory();
  } else {
    status.textContent = 'Not logged in';
    authForms.style.display = '';
    logoutBtn.style.display = 'none';
    game.style.display = 'none';
    document.getElementById('history-list').innerHTML = '';
  }
}

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;
  const res = await fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
    const data = await res.json();
    localStorage.setItem('token', data.token);
    await refreshStatus();
  } else {
    const data = await res.json();
    document.getElementById('status').textContent = `Error: ${data.error}`;
  }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
    const data = await res.json();
    localStorage.setItem('token', data.token);
    await refreshStatus();
  } else {
    const data = await res.json();
    document.getElementById('status').textContent = `Error: ${data.error}`;
  }
});

document.getElementById('logout-button').addEventListener('click', async () => {
  await fetch('/logout', { method: 'POST', headers: { ...authHeaders() } });
  localStorage.removeItem('token');
  await refreshStatus();
});

document.getElementById('player-letter').addEventListener('change', (e) => {
  playerLetter = e.target.value;
  newGame();
});

document.getElementById('mode-pvp').addEventListener('click', () => {
  if (mode === 'pvp') return;
  mode = 'pvp';
  updateModeButtons();
  clearAiComment();
  newGame();
});

document.getElementById('mode-pvai').addEventListener('click', () => {
  if (mode === 'pvai') return;
  mode = 'pvai';
  updateModeButtons();
  clearAiComment();
  newGame();
});

document.getElementById('board').addEventListener('click', (e) => {
  const cell = e.target.closest('.cell');
  if (!cell || cell.disabled) return;
  if (aiThinking) return;
  makeMove(Number(cell.dataset.index));
});

document.getElementById('new-game-button').addEventListener('click', newGame);

refreshStatus();
