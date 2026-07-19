const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * ECONOMIC CALENDAR (scaffold)
 * ----------------------------
 * Forex Factory has no official public API. For real data, sign up for one
 * of these and drop the key into .env as ECON_CALENDAR_API_KEY:
 *   - Finnhub (finnhub.io)        — free tier includes economic calendar
 *   - Trading Economics (tradingeconomics.com/api) — paid, very complete
 *   - FXStreet / Investing.com    — usually require a commercial agreement
 *
 * Below is mock data shaped like a typical calendar response so the UI can
 * be built and tested today. Swap `getMockEvents()` for a real fetch once
 * you have a provider key.
 */

function getMockEvents() {
  const today = new Date();
  const iso = (offsetHours) => new Date(today.getTime() + offsetHours * 3600 * 1000).toISOString();

  return [
    {
      id: 'evt_1',
      time: iso(1),
      currency: 'USD',
      title: 'Non-Farm Payrolls',
      impact: 'high',
      actual: null,
      forecast: '180K',
      previous: '175K',
    },
    {
      id: 'evt_2',
      time: iso(3),
      currency: 'EUR',
      title: 'ECB Interest Rate Decision',
      impact: 'high',
      actual: null,
      forecast: '3.75%',
      previous: '3.75%',
    },
    {
      id: 'evt_3',
      time: iso(-2),
      currency: 'GBP',
      title: 'CPI y/y',
      impact: 'medium',
      actual: '2.1%',
      forecast: '2.0%',
      previous: '2.3%',
    },
    {
      id: 'evt_4',
      time: iso(6),
      currency: 'JPY',
      title: 'BoJ Policy Statement',
      impact: 'high',
      actual: null,
      forecast: null,
      previous: null,
    },
    {
      id: 'evt_5',
      time: iso(8),
      currency: 'AUD',
      title: 'Retail Sales m/m',
      impact: 'low',
      actual: null,
      forecast: '0.3%',
      previous: '0.1%',
    },
  ];
}

// GET /api/calendar/events
router.get('/events', requireAuth, async (req, res) => {
  // TODO once you have a provider key:
  // const response = await fetch(`https://finnhub.io/api/v1/calendar/economic?token=${process.env.ECON_CALENDAR_API_KEY}`);
  // const data = await response.json();
  // return res.json({ events: data.economicCalendar });

  res.json({ events: getMockEvents() });
});

module.exports = router;
