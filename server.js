require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const GAMES_FILE = path.join(__dirname, 'data', 'games.json');

app.use(express.json());

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readGames() {
  try {
    const raw = fs.readFileSync(GAMES_FILE, 'utf8');
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeGames(games) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2));
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.slice(7);
  const users = readUsers();
  const user = users.find(u => u.token === token);
  req.user = user ? { username: user.username } : null;
  next();
}

app.use(authMiddleware);
app.use(express.static(path.join(__dirname, 'public')));

app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const users = readUsers();
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Username taken' });
  }
  const token = generateToken();
  users.push({ username, password, token });
  writeUsers(users);
  res.status(201).json({ username, token });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const userIndex = users.findIndex(u => u.username === username && u.password === password);
  if (userIndex === -1) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken();
  users[userIndex].token = token;
  writeUsers(users);
  res.status(200).json({ username, token });
});

app.post('/logout', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  const users = readUsers();
  const userIndex = users.findIndex(u => u.username === req.user.username);
  if (userIndex !== -1) {
    users[userIndex].token = null;
    writeUsers(users);
  }
  res.status(200).json({ ok: true });
});

app.post('/games', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  const { winner, result, board } = req.body;
  if (!['win', 'draw'].includes(result)) {
    return res.status(400).json({ error: 'Invalid result' });
  }
  if (!Array.isArray(board) || board.length !== 9) {
    return res.status(400).json({ error: 'Invalid board' });
  }
  const record = {
    username: req.user.username,
    winner: winner || null,
    result,
    board,
    timestamp: new Date().toISOString()
  };
  const games = readGames();
  games.push(record);
  writeGames(games);
  res.status(201).json(record);
});

app.get('/games', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  const games = readGames();
  const userGames = games
    .filter(g => g.username === req.user.username)
    .reverse();
  res.json(userGames);
});

app.get('/me', (req, res) => {
  if (req.user) {
    res.json({ loggedIn: true, username: req.user.username });
  } else {
    res.json({ loggedIn: false });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
