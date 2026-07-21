const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { findById, updateDemoBalance } = require('../models/User');
const { sendPushNotification } = require('../utils/pushNotifications');

const router = express.Router();

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

// --- Seeded random helpers, used only for generating stable-looking chart history ---
function seedFromString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function closePositionInternal(position, exitPrice, reason) {
  const direction = position.side === 'buy' ? 1 : -1;
  const pnl = Number(((exitPrice - Number(position.entry_price)) * direction * Number(position.units)).toFixed(2));
  const user = await findById(position.user_id);
  const newBalance = Number((user.demoBalance + pnl).toFixed(2));

  await pool.query('DELETE FROM demo_positions WHERE id = $1', [position.id]);
  await pool.query(
    `INSERT INTO trade_history (id, user_id, pair, side, units, entry_price, exit_price, pnl)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [uuidv4(), position.user_id, position.pair, position.side, position.units, position.entry_price, exitPrice, pnl]
  );
  await updateDemoBalance(position.user_id, newBalance);

  if (user.expoPushToken) {
    sendPushNotification(user.expoPushToken, {
      title: reason === 'stop_loss' ? 'Stop-loss triggered' : reason === 'take_profit' ? 'Take-profit hit' : (pnl >= 0 ? 'Position closed — profit' : 'Position closed — loss'),
      body: `${position.pair} ${position.side.toUpperCase()} closed with P&L of ${pnl >= 0 ? '+' : ''}$${pnl}`,
    });
  }
}

// Checks the requesting user's own pending limit orders and open positions
// against fresh prices — fills limit orders that qualify, and auto-closes
// positions that hit their stop-loss or take-profit.
async function processFillsForUser(userId, prices) {
  const pending = await pool.query('SELECT * FROM pending_orders WHERE user_id = $1', [userId]);
  for (const order of pending.rows) {
    const price = prices[order.pair];
    if (!price) continue;
    const target = Number(order.target_price);
    const shouldFill = (order.side === 'buy' && price <= target) || (order.side === 'sell' && price >= target);
    if (shouldFill) {
      await pool.query('DELETE FROM pending_orders WHERE id = $1', [order.id]);
      await pool.query(
        `INSERT INTO demo_positions (id, user_id, pair, side, units, entry_price, stop_loss, take_profit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [uuidv4(), userId, order.pair, order.side, order.units, price, order.stop_loss, order.take_profit]
      );
    }
  }

  const positions = await pool.query('SELECT * FROM demo_positions WHERE user_id = $1', [userId]);
  for (const pos of positions.rows) {
    const price = prices[pos.pair];
    if (!price) continue;
    const sl = pos.stop_loss ? Number(pos.stop_loss) : null;
    const tp = pos.take_profit ? Number(pos.take_profit) : null;

    let hitStopLoss = false;
    let hitTakeProfit = false;
    if (pos.side === 'buy') {
      if (sl && price <= sl) hitStopLoss = true;
      if (tp && price >= tp) hitTakeProfit = true;
    } else {
      if (sl && price >= sl) hitStopLoss = true;
      if (tp && price <= tp) hitTakeProfit = true;
    }

    if (hitStopLoss) await closePositionInternal(pos, price, 'stop_loss');
    else if (hitTakeProfit) await closePositionInternal(pos, price, 'take_profit');
  }
}

// GET /api/demo/prices
router.get('/prices', requireAuth, async (req, res) => {
  const prices = Object.fromEntries(
    Object.entries(PAIRS).map(([pair, base]) => [pair, priceWithJitter(base)])
  );

  try {
    await processFillsForUser(req.userId, prices);
  } catch (err) {
    console.error('Error processing fills:', err);
  }

  res.json({ prices });
});

// GET /api/demo/candles?pair=EURUSD&count=50
// Generates realistic-looking historical candlestick data. Not real market
// data — replace with a real price feed once connected to a live broker API.
router.get('/candles', requireAuth, (req, res) => {
  const pair = req.query.pair;
  const count = Math.min(parseInt(req.query.count) || 50, 200);

  if (!PAIRS[pair]) return res.status(400).json({ error: 'Unknown currency pair.' });

  const base = PAIRS[pair];
  const dayBucket = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const rand = mulberry32(seedFromString(pair + dayBucket));

  const candles = [];
  let price = base * (0.98 + rand() * 0.04);
  const now = Date.now();
  const intervalMs = 60 * 60 * 1000; // 1 hour candles

  for (let i = count - 1; i >= 0; i--) {
    const open = price;
    const volatility = base * 0.002;
    const close = open + (rand() - 0.5) * volatility * 2;
    const high = Math.max(open, close) + rand() * volatility;
    const low = Math.min(open, close) - rand() * volatility;
    candles.push({
      time: now - i * intervalMs,
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
    });
    price = close;
  }

  res.json({ candles });
});

// GET /api/demo/positions
router.get('/positions', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM demo_positions WHERE user_id = $1 ORDER BY opened_at DESC', [req.userId]);
  const positions = result.rows.map((r) => ({
    id: r.id,
    pair: r.pair,
    side: r.side,
    units: Number(r.units),
    entryPrice: Number(r.entry_price),
    stopLoss: r.stop_loss ? Number(r.stop_loss) : null,
    takeProfit: r.take_profit ? Number(r.take_profit) : null,
    openedAt: r.opened_at,
  }));
  res.json({ positions });
});

// GET /api/demo/pending-orders
router.get('/pending-orders', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM pending_orders WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
  const orders = result.rows.map((r) => ({
    id: r.id,
    pair: r.pair,
    side: r.side,
    units: Number(r.units),
    targetPrice: Number(r.target_price),
    stopLoss: r.stop_loss ? Number(r.stop_loss) : null,
    takeProfit: r.take_profit ? Number(r.take_profit) : null,
    createdAt: r.created_at,
  }));
  res.json({ orders });
});

// DELETE /api/demo/pending-orders/:id
router.delete('/pending-orders/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM pending_orders WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ cancelled: true });
});

// POST /api/demo/order
// body: { pair, side, units, orderType: 'market'|'limit', targetPrice?, stopLoss?, takeProfit? }
router.post('/order', requireAuth, async (req, res) => {
  const { pair, side, units, orderType = 'market', targetPrice, stopLoss, takeProfit } = req.body;

  if (!PAIRS[pair]) return res.status(400).json({ error: 'Unknown currency pair.' });
  if (!['buy', 'sell'].includes(side)) return res.status(400).json({ error: 'Side must be buy or sell.' });
  if (!units || units <= 0) return res.status(400).json({ error: 'Units must be a positive number.' });
  if (!['market', 'limit'].includes(orderType)) return res.status(400).json({ error: 'orderType must be market or limit.' });

  if (orderType === 'limit') {
    if (!targetPrice || targetPrice <= 0) return res.status(400).json({ error: 'targetPrice is required for limit orders.' });

    const id = uuidv4();
    await pool.query(
      `INSERT INTO pending_orders (id, user_id, pair, side, units, target_price, stop_loss, take_profit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, req.userId, pair, side, units, targetPrice, stopLoss || null, takeProfit || null]
    );
    return res.status(201).json({
      pendingOrder: { id, pair, side, units, targetPrice, stopLoss: stopLoss || null, takeProfit: takeProfit || null },
    });
  }

  const entryPrice = priceWithJitter(PAIRS[pair]);
  const id = uuidv4();

  await pool.query(
    `INSERT INTO demo_positions (id, user_id, pair, side, units, entry_price, stop_loss, take_profit)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, req.userId, pair, side, units, entryPrice, stopLoss || null, takeProfit || null]
  );

  const user = await findById(req.userId);
  res.status(201).json({
    position: { id, pair, side, units, entryPrice, stopLoss: stopLoss || null, takeProfit: takeProfit || null, openedAt: new Date().toISOString() },
    demoBalance: user.demoBalance,
  });
});

// POST /api/demo/close/:positionId
router.post('/close/:positionId', requireAuth, async (req, res) => {
  const posResult = await pool.query('SELECT * FROM demo_positions WHERE id = $1 AND user_id = $2', [req.params.positionId, req.userId]);
  const position = posResult.rows[0];
  if (!position) return res.status(404).json({ error: 'Position not found.' });

  const exitPrice = priceWithJitter(PAIRS[position.pair]);
  const direction = position.side === 'buy' ? 1 : -1;
  const pnl = Number(((exitPrice - Number(position.entry_price)) * direction * Number(position.units)).toFixed(2));

  const user = await findById(req.userId);
  const newBalance = Number((user.demoBalance + pnl).toFixed(2));

  await pool.query('DELETE FROM demo_positions WHERE id = $1', [position.id]);
  await pool.query(
    `INSERT INTO trade_history (id, user_id, pair, side, units, entry_price, exit_price, pnl)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [uuidv4(), req.userId, position.pair, position.side, position.units, position.entry_price, exitPrice, pnl]
  );
  await updateDemoBalance(req.userId, newBalance);

  if (user.expoPushToken) {
    sendPushNotification(user.expoPushToken, {
      title: pnl >= 0 ? 'Position closed — profit' : 'Position closed — loss',
      body: `${position.pair} ${position.side.toUpperCase()} closed with P&L of ${pnl >= 0 ? '+' : ''}$${pnl}`,
    });
  }

  res.json({ closedPosition: { ...position, exitPrice, pnl }, demoBalance: newBalance });
});

// GET /api/demo/history
router.get('/history', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM trade_history WHERE user_id = $1 ORDER BY closed_at DESC LIMIT 100', [req.userId]);
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
