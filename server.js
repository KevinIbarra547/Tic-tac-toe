require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 5000;
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const GAMES_FILE = path.join(__dirname, 'data', 'games.json');
const REFLECTIONS_FILE = path.join(__dirname, 'data', 'reflections.json');

if (!process.env.GROQ_API_KEY) {
  console.warn('WARNING: GROQ_API_KEY not set in .env — AI moves will use random fallback');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

function readReflections() {
  try {
    const raw = fs.readFileSync(REFLECTIONS_FILE, 'utf8');
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function findTacticalMove(board, player) {
  const opponent = player === 'O' ? 'X' : 'O';
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    const cells = [board[a], board[b], board[c]];
    if (cells.filter(x => x === player).length === 2 && cells.includes('')) {
      return [a,b,c][cells.indexOf('')];
    }
  }
  for (const [a,b,c] of lines) {
    const cells = [board[a], board[b], board[c]];
    if (cells.filter(x => x === opponent).length === 2 && cells.includes('')) {
      return [a,b,c][cells.indexOf('')];
    }
  }
  if (board[4] === '') return 4;
  for (const i of [0,2,6,8]) { if (board[i] === '') return i; }
  for (const i of [1,3,5,7]) { if (board[i] === '') return i; }
  return null;
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
  const { winner, result, board, mode, difficulty, personality } = req.body;
  if (!['win', 'draw'].includes(result)) {
    return res.status(400).json({ error: 'Invalid result' });
  }
  if (!Array.isArray(board) || board.length !== 9) {
    return res.status(400).json({ error: 'Invalid board' });
  }
  const gameMode = mode === 'pvai' ? 'pvai' : 'pvp';
  if (gameMode === 'pvai') {
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty for pvai game' });
    }
    if (!['pirate', 'wizard', 'robot'].includes(personality)) {
      return res.status(400).json({ error: 'Invalid personality for pvai game' });
    }
  }
  const record = {
    username: req.user.username,
    winner: winner || null,
    result,
    board,
    mode: gameMode,
    difficulty: gameMode === 'pvai' ? difficulty : null,
    personality: gameMode === 'pvai' ? personality : null,
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

app.get('/leaderboard', (req, res) => {
  const games = readGames();
  const stats = {};
  for (const game of games) {
    const u = game.username;
    if (!stats[u]) stats[u] = { wins: 0, losses: 0, draws: 0 };
    if (game.result === 'draw') {
      stats[u].draws++;
    } else if (game.result === 'win') {
      if (game.winner === 'X') {
        stats[u].wins++;
      } else {
        stats[u].losses++;
      }
    }
  }
  const qualified = [];
  let stillQualifyingCount = 0;
  for (const [username, s] of Object.entries(stats)) {
    const totalGames = s.wins + s.losses + s.draws;
    if (totalGames >= 5) {
      qualified.push({
        username,
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        totalGames,
        winRate: s.wins / totalGames
      });
    } else {
      stillQualifyingCount++;
    }
  }
  qualified.sort((a, b) => b.winRate - a.winRate || b.totalGames - a.totalGames);
  res.json({ qualified, stillQualifyingCount });
});

app.get('/ai-stats', (req, res) => {
  const games = readGames();
  const initBucket = () => ({ games: 0, aiWins: 0, playerWins: 0, draws: 0, aiWinRate: 0 });
  const byDifficulty = { easy: initBucket(), medium: initBucket(), hard: initBucket() };
  const byPersonality = { pirate: initBucket(), wizard: initBucket(), robot: initBucket() };
  for (const game of games) {
    if (game.mode !== 'pvai' || !game.difficulty || !game.personality) continue;
    const d = byDifficulty[game.difficulty];
    const p = byPersonality[game.personality];
    if (!d || !p) continue;
    for (const bucket of [d, p]) {
      bucket.games++;
      if (game.result === 'draw') bucket.draws++;
      else if (game.winner === 'O') bucket.aiWins++;
      else if (game.winner === 'X') bucket.playerWins++;
    }
  }
  for (const bucket of [
    ...Object.values(byDifficulty),
    ...Object.values(byPersonality)
  ]) {
    bucket.aiWinRate = bucket.games > 0 ? bucket.aiWins / bucket.games : 0;
  }
  res.json({ byDifficulty, byPersonality });
});

app.get('/reflections', (req, res) => {
  res.json(readReflections());
});

const DIFFICULTY_INSTRUCTIONS = {
  easy: `Pick a move, but make it slightly suboptimal — don't always block obvious threats and don't always take winning moves. Sometimes just pick a random available cell.`,
  medium: `Play a reasonable game of tic-tac-toe. Block obvious threats and take winning moves when available, but you don't need to play perfectly.`,
  hard: `Play tic-tac-toe optimally. Always take a winning move if available. Always block the opponent if they have two-in-a-row. Otherwise prefer center, then corners, then edges. Try to set up forks (two threats at once).`
};

const DIFFICULTY_TEMPS = { easy: 1.2, medium: 0.7, hard: 0.3 };

const PERSONALITY_INSTRUCTIONS = {
  pirate: `You talk like a stereotypical pirate. Use "Arrr", "matey", "ye", "scallywag", and reference treasure, ships, or the sea. Your comment must be 1 short sentence, max 12 words.`,
  wizard: `You talk like a fantasy wizard. Reference magic, runes, ancient powers, prophecy, or spells. Your comment must be 1 short sentence, max 12 words.`,
  robot: `You talk like a stereotypical robot/AI. Use ALL CAPS or stilted speech, reference probabilities, calculations, logic, processing. Use vocabulary like "INITIATING", "COMPUTING", "ERROR". Your comment must be 1 short sentence, max 12 words.`
};

const PERSONALITY_FALLBACKS = {
  pirate: 'Arrr, that be me move.',
  wizard: 'The runes have spoken.',
  robot: 'MOVE EXECUTED.'
};

app.post('/ai-move', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });

  const { board, difficulty, personality } = req.body;

  if (!Array.isArray(board) || board.length !== 9 ||
      !board.every(c => c === 'X' || c === 'O' || c === '')) {
    return res.status(400).json({ error: 'Invalid board' });
  }

  if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
    return res.status(400).json({ error: 'difficulty must be easy, medium, or hard' });
  }

  if (!personality || !['pirate', 'wizard', 'robot'].includes(personality)) {
    return res.status(400).json({ error: 'personality must be pirate, wizard, or robot' });
  }

  const available = [];
  board.forEach((cell, i) => { if (cell === '') available.push(i); });

  if (available.length === 0) {
    return res.status(400).json({ error: 'No moves available' });
  }

  const fallbackMove = available[Math.floor(Math.random() * available.length)];
  const fallbackComment = PERSONALITY_FALLBACKS[personality];
  const tacticalMove = difficulty === 'hard' ? findTacticalMove(board, 'O') : null;

  const prompt = `You are playing Tic Tac Toe as player O. Positions are indexed 0-8, left-to-right, top-to-bottom:

 0 | 1 | 2
-----------
 3 | 4 | 5
-----------
 6 | 7 | 8

Current board: ${JSON.stringify(board)}
Available moves (empty positions): [${available.join(', ')}]

SKILL LEVEL — how you play:
${DIFFICULTY_INSTRUCTIONS[difficulty]}

PERSONALITY — how you talk:
${PERSONALITY_INSTRUCTIONS[personality]}

Respond with ONLY valid JSON: {"move": <index from available moves>, "comment": "<one short in-character sentence, max 12 words>"}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: DIFFICULTY_TEMPS[difficulty],
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }]
      });
      const parsed = JSON.parse(completion.choices[0].message.content);
      const move = (difficulty === 'hard' && tacticalMove !== null) ? tacticalMove : Number(parsed.move);
      if (!available.includes(move)) continue;
      const comment = (typeof parsed.comment === 'string' && parsed.comment.trim())
        ? parsed.comment.trim()
        : fallbackComment;
      return res.json({ move, comment });
    } catch (err) {
      console.error('Groq attempt', attempt, 'failed:', err.message);
    }
  }

  res.json({ move: tacticalMove !== null ? tacticalMove : fallbackMove, comment: fallbackComment });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
