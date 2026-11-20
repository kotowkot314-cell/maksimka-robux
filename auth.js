const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'xliilx-change-me-in-prod';

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Заполни все поля' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Ник минимум 3 символа' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль минимум 6 символов' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const info = stmt.run(username, hash);
    const token = jwt.sign({ id: info.lastInsertRowid, username }, SECRET);
    res.json({ token, username });
  } catch (e) {
    res.status(400).json({ error: 'Ник уже занят' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(400).json({ error: 'Неверный логин/пароль' });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).json({ error: 'Неверный логин/пароль' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET);
  res.json({ token, username: user.username });
});

module.exports = router;