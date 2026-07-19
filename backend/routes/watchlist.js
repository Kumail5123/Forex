const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/watchlist
router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT pair FROM watchlist_pairs WHERE user_id = $1', [req.userId]);
  res.json({ pairs: result.rows.map((r) => r.pair) });
});

// POST /api/watchlist  { pair }
router.post('/', requireAuth, async (req, res) => {
  const { pair } = req.body;
  if (!pair) return res.status(400).json({ error: 'pair is required.' });

  await pool.query(
    'INSERT INTO watchlist_pairs (user_id, pair) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.userId, pair]
  );

  const result = await pool.query('SELECT pair FROM watchlist_pairs WHERE user_id = $1', [req.userId]);
  res.status(201).json({ pairs: result.rows.map((r) => r.pair) });
});

// DELETE /api/watchlist/:pair
router.delete('/:pair', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM watchlist_pairs WHERE user_id = $1 AND pair = $2', [req.userId, req.params.pair]);
  const result = await pool.query('SELECT pair FROM watchlist_pairs WHERE user_id = $1', [req.userId]);
  res.json({ pairs: result.rows.map((r) => r.pair) });
});

module.exports = router;
