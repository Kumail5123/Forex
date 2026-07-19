const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { findById, updateDemoBalance } = require('../models/User');
const { sendPushNotification } = require('../utils/pushNotifications');

const router = express.Router();

// Mock live-ish prices so the demo dashboard has something to render.
// Replace with a real streaming price feed (broker API) later.
const PAIRS = {
  EURUSD: 1.0842,
  GBPUSD: 1.2673,
  USDJPY: 156.21,
  AUDUSD: 0.6591,
};

function priceWithJitter(base) {
  const jitter = (Math.random() - 0.5) * base * 0.0006;
  return Number((base + jitter).toFixed(5));
}

// GET /api/demo/prices
router.get('/prices', requireAuth, (req, res) => {
  const prices = Object.fromEntries(
    Object.entries(PAIRS).map(([pair, base]) => [pair, priceWithJitter(base)])
  );
  res.json({ prices });
});

// GET /api/demo/positions
router.get('/positions', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM demo_positions WHERE user_id = $1 ORDER BY opened_at DESC',
    [req.userId]
  );
  const positions = result.rows.map((r) => ({
    id: r.id,
    pair: r.pair,
    side: r.side,
    units: Number(r.units),
    entryPrice: Number(r.entry_price),
    openedAt: r.opened_at,
  }));
  res.json({ positions });
});

// POST /api/demo/order  { pair, side: 'buy'|'sell', units }
router.post('/order', requireAuth, async (req, res) => {
  const { pair, side, units } = req.body;

  if (!PAIRS[pair]) return res.status(400).json({ error: 'Unknown currency pair.' });
  if (!['buy', 'sell'].includes(side)) return res.status(400).json({ error: 'Side must be buy or sell.' });
  if (!units || units <= 0) return res.status(400).json({ error: 'Units must be a positive number.' });

  const entryPrice = priceWithJitter(PAIRS[pair]);
  const id = uuidv4();

  await pool.query(
    `INSERT INTO demo_positions (id, user_id, pair, side, units, entry_price)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, req.userId, pair, side, units, entryPrice]
  );

  const user = await findById(req.userId);
  res.status(201).json({
    position: { id, pair, side, units, entryPrice, openedAt: new Date().toISOString() },
    demoBalance: user.demoBalance,
  });
});

// POST /api/demo/close/:positionId
router.post('/close/:positionId', requireAuth, async (req, res) => {
  const posResult = await pool.query(
    'SELECT * FROM demo_positions WHERE id = $1 AND user_id = $2',
    [req.params.positionId, req.userId]
  );
  const position = posResult.rows[0];
  if (!position) return res.status(404).json({ error: 'Position not found.' });

  const exitPrice = priceWithJitter(PAIRS[position.pair]);
  const direction = position.side === 'buy' ? 1 : -1;
  const pnl = Number(((exitPrice - Number(position.entry_price)) * direction * Number(position.units)).toFixed(2));

  const user = await findById(req.userId);
  const newBalance = Number((user.demoBalance + pnl).toFixed(2));

  await pool.query('BEGIN');
  try {
    await pool.query('DELETE FROM demo_positions WHERE id = $1', [position.id]);
    await pool.query(
      `INSERT INTO trade_history (id, user_id, pair, side, units, entry_price, exit_price, pnl)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), req.userId, position.pair, position.side, position.units, position.entry_price, exitPrice, pnl]
    );
    await updateDemoBalance(req.userId, newBalance);
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }

  if (user.expoPushToken) {
    sendPushNotification(user.expoPushToken, {
      title: pnl >= 0 ? 'Position closed — profit' : 'Position closed — loss',
      body: `${position.pair} ${position.side.toUpperCase()} closed with P&L of ${pnl >= 0 ? '+' : ''}$${pnl}`,
    });
  }

  res.json({
    closedPosition: { ...position, exitPrice, pnl },
    demoBalance: newBalance,
  });
});

// GET /api/demo/history
router.get('/history', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM trade_history WHERE user_id = $1 ORDER BY closed_at DESC LIMIT 100',
    [req.userId]
  );
  const history = result.rows.map((r) => ({
    id: r.id,
    pair: r.pair,
    side: r.side,
    units: Number(r.units),
    entryPrice: Number(r.entry_price),
    exitPrice: Number(r.exit_price),
    pnl: Number(r.pnl),
    closedAt: r.closed_at,
  }));
  res.json({ history });
});

module.exports = router;
