const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { findById, setBrokerConnected } = require('../models/User');

const router = express.Router();

/**
 * WORKING TODAY: AvaPartner tagged referral links
 * (see README.md for full explanation of this model and its limitations)
 */
const AVA_TAG = process.env.AVA_PARTNER_TAG || 'YOUR_TAG_HERE';

const REFERRAL_LINKS = {
  liveWebTrader: `https://www.avatrade.com/trading-account/?p=Webtrader&tag=${AVA_TAG}`,
  liveMT4: `https://www.avatrade.com/trading-account/?p=MetaTrader4&tag=${AVA_TAG}`,
  liveMT5: `https://www.avatrade.com/trading-account/?p=MetaTrader5&tag=${AVA_TAG}`,
  demo: `https://www.avatrade.com/demo-account?tag=${AVA_TAG}`,
  homepage: `https://www.avatrade.com?tag=${AVA_TAG}`,
};

// GET /api/broker/links
router.get('/links', requireAuth, (req, res) => {
  res.json({ links: REFERRAL_LINKS });
});

/**
 * POSTBACK RECEIVER — AvaPartner "Postback Pixels"
 * See README.md for the exact URL format to paste into AvaPartner's
 * "+ Add" pixel form.
 */
const POSTBACK_SECRET = process.env.AVA_POSTBACK_SECRET || 'change_me_to_a_random_string';

router.get('/postback', async (req, res) => {
  if (req.query.secret !== POSTBACK_SECRET) {
    return res.status(403).send('Forbidden');
  }

  const { clickId, customerId, eventName, tradingPlatform, country, eventDate, custom1 } = req.query;

  await pool.query(
    `INSERT INTO postback_events (click_id, customer_id, event_name, trading_platform, country, event_date, custom1, raw)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [clickId || null, customerId || null, eventName || null, tradingPlatform || null, country || null, eventDate || null, custom1 || null, JSON.stringify(req.query)]
  );

  console.log('AvaPartner postback:', eventName, customerId);
  res.status(200).send('OK');
});

// GET /api/broker/postback-log
router.get('/postback-log', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM postback_events ORDER BY received_at DESC LIMIT 50');
  res.json({ events: result.rows });
});

/**
 * FUTURE / NOT YET AVAILABLE: manual "mark as connected" toggle.
 * Kept simple since there's no real API to verify connection status yet —
 * see README.md for what a true OAuth-based integration would need.
 */
router.post('/mark-connected', requireAuth, async (req, res) => {
  await setBrokerConnected(req.userId, true);
  res.json({ connected: true });
});

router.get('/status', requireAuth, async (req, res) => {
  const user = await findById(req.userId);
  res.json({ connected: Boolean(user?.brokerConnected) });
});

router.delete('/disconnect', requireAuth, async (req, res) => {
  await setBrokerConnected(req.userId, false);
  res.json({ connected: false });
});

module.exports = router;
