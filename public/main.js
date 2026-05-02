// --- game state ---
let board = Array(9).fill('');
let currentTurn = 'X';

function renderBoard() {
  document.querySelectorAll('.cell').forEach((cell, i) => {
    cell.textContent = board[i];
    cell.disabled = board[i] !== '';
  });
  document.getElementById('turn-indicator').textContent = `Current turn: ${currentTurn}`;
}

function newGame() {
  board = Array(9).fill('');
  currentTurn = 'X';
  renderBoard();
}

function makeMove(index) {
  if (board[index] !== '') return;
  board[index] = currentTurn;
  currentTurn = currentTurn === 'X' ? 'O' : 'X';
  renderBoard();
}

// --- auth ---
async function refreshStatus() {
  const res = await fetch('/me');
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
  } else {
    status.textContent = 'Not logged in';
    authForms.style.display = '';
    logoutBtn.style.display = 'none';
    game.style.display = 'none';
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
    await refreshStatus();
  } else {
    const data = await res.json();
    document.getElementById('status').textContent = `Error: ${data.error}`;
  }
});

document.getElementById('logout-button').addEventListener('click', async () => {
  await fetch('/logout', { method: 'POST' });
  await refreshStatus();
});

document.getElementById('board').addEventListener('click', (e) => {
  const cell = e.target.closest('.cell');
  if (!cell || cell.disabled) return;
  makeMove(Number(cell.dataset.index));
});

document.getElementById('new-game-button').addEventListener('click', newGame);

refreshStatus();
