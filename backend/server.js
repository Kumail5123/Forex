require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initSchema } = require('./db');

const authRoutes = require('./routes/auth');
const brokerRoutes = require('./routes/broker');
const demoRoutes = require('./routes/demo');
const calendarRoutes = require('./routes/calendar');
const notificationsRoutes = require('./routes/notifications');
const watchlistRoutes = require('./routes/watchlist');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/broker', brokerRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/watchlist', watchlistRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

const PORT = process.env.PORT || 4000;

initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Forex app backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  });
