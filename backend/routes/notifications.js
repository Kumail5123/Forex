const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { setPushToken } = require('../models/User');
const { sendPushNotification } = require('../utils/pushNotifications');

const router = express.Router();

// POST /api/notifications/register-token
router.post('/register-token', requireAuth, async (req, res) => {
  const { expoPushToken } = req.body;
  if (!expoPushToken) return res.status(400).json({ error: 'expoPushToken is required.' });

  await setPushToken(req.userId, expoPushToken);
  res.json({ registered: true });
});

// POST /api/notifications/price-alerts  { pair, targetPrice, direction: 'above'|'below' }
router.post('/price-alerts', requireAuth, async (req, res) => {
  const { pair, targetPrice, direction } = req.body;
  if (!pair || !targetPrice || !['above', 'below'].includes(direction)) {
    return res.status(400).json({ error: 'pair, targetPrice, and direction (above/below) are required.' });
  }

  const id = uuidv4();
  await pool.query(
    `INSERT INTO price_alerts (id, user_id, pair, target_price, direction) VALUES ($1, $2, $3, $4, $5)`,
    [id, req.userId, pair, targetPrice, direction]
  );

  res.status(201).json({ alert: { id, pair, targetPrice, direction, active: true } });
});

// GET /api/notifications/price-alerts
router.get('/price-alerts', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM price_alerts WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
  const alerts = result.rows.map((r) => ({
    id: r.id,
    pair: r.pair,
    targetPrice: Number(r.target_price),
    direction: r.direction,
    active: r.active,
  }));
  res.json({ alerts });
});

// DELETE /api/notifications/price-alerts/:id
router.delete('/price-alerts/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM price_alerts WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.json({ deleted: true });
});

// Called by the demo price loop (or a scheduled job) to fire due alerts.
async function checkAndFireAlerts(prices) {
  const result = await pool.query('SELECT pa.*, u.expo_push_token FROM price_alerts pa JOIN users u ON u.id = pa.user_id WHERE pa.active = TRUE');

  for (const alert of result.rows) {
    const currentPrice = prices[alert.pair];
    if (!currentPrice) continue;

    const target = Number(alert.target_price);
    const triggered =
      (alert.direction === 'above' && currentPrice >= target) ||
      (alert.direction === 'below' && currentPrice <= target);

    if (triggered) {
      if (alert.expo_push_token) {
        await sendPushNotification(alert.expo_push_token, {
          title: `${alert.pair} price alert`,
          body: `${alert.pair} is now ${alert.direction} ${target} (currently ${currentPrice})`,
        });
      }
      await pool.query('UPDATE price_alerts SET active = FALSE WHERE id = $1', [alert.id]);
    }
  }
}

module.exports = router;
module.exports.checkAndFireAlerts = checkAndFireAlerts;
