// --- game state ---
const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

let board = Array(9).fill('');
let currentTurn = 'X';
let gameOver = false;

function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function renderBoard() {
  document.querySelectorAll('.cell').forEach((cell, i) => {
    cell.textContent = board[i];
    cell.disabled = gameOver || board[i] !== '';
  });
}

function newGame() {
  board = Array(9).fill('');
  currentTurn = 'X';
  gameOver = false;
  renderBoard();
  document.getElementById('turn-indicator').textContent = 'Current turn: X';
}

function makeMove(index) {
  if (gameOver || board[index] !== '') return;
  board[index] = currentTurn;

  const winner = checkWinner(board);
  if (winner) {
    gameOver = true;
    renderBoard();
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
}

async function saveGame(winner, result) {
  try {
    await fetch('/games', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner, result, board: board.slice() })
    });
    await loadHistory();
  } catch (err) {
    console.error('saveGame failed:', err);
  }
}

async function loadHistory() {
  try {
    const res = await fetch('/games', { credentials: 'include' });
    if (!res.ok) return;
    const games = await res.json();
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    games.forEach(game => {
      const li = document.createElement('li');
      const when = new Date(game.timestamp).toLocaleString();
      if (game.result === 'win') {
        li.textContent = `Win (${game.winner}) — ${when}`;
      } else {
        li.textContent = `Draw — ${when}`;
      }
      list.appendChild(li);
    });
  } catch (err) {
    console.error('loadHistory failed:', err);
  }
}

// --- auth ---
async function refreshStatus() {
  const res = await fetch('/me', { credentials: 'include' });
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
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
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
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
    await refreshStatus();
  } else {
    const data = await res.json();
    document.getElementById('status').textContent = `Error: ${data.error}`;
  }
});

document.getElementById('logout-button').addEventListener('click', async () => {
  await fetch('/logout', { method: 'POST', credentials: 'include' });
  await refreshStatus();
});

document.getElementById('board').addEventListener('click', (e) => {
  const cell = e.target.closest('.cell');
  if (!cell || cell.disabled) return;
  makeMove(Number(cell.dataset.index));
});

document.getElementById('new-game-button').addEventListener('click', newGame);

refreshStatus();
