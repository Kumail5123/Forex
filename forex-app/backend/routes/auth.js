const express = require('express');
const jwt = require('jsonwebtoken');
const { createUser, verifyCredentials, findById } = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function issueToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Full name, email, and password are all required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const user = await createUser({ email, password, fullName });
    const token = issueToken(user.id);

    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === 'USER_EXISTS') {
      return res.status(409).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating your account.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await verifyCredentials(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const token = issueToken(user.id);
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong logging in.' });
  }
});

// GET /api/auth/me — returns the logged-in user (used to keep sessions alive)
router.get('/me', requireAuth, async (req, res) => {
  const user = await findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

module.exports = router;
