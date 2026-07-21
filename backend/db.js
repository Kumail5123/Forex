const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/forex_app',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      demo_balance NUMERIC NOT NULL DEFAULT 10000,
      broker_connected BOOLEAN NOT NULL DEFAULT FALSE,
      expo_push_token TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS demo_positions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pair TEXT NOT NULL,
      side TEXT NOT NULL,
      units NUMERIC NOT NULL,
      entry_price NUMERIC NOT NULL,
      stop_loss NUMERIC,
      take_profit NUMERIC,
      opened_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS pending_orders (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pair TEXT NOT NULL,
      side TEXT NOT NULL,
      units NUMERIC NOT NULL,
      target_price NUMERIC NOT NULL,
      stop_loss NUMERIC,
      take_profit NUMERIC,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS trade_history (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pair TEXT NOT NULL,
      side TEXT NOT NULL,
      units NUMERIC NOT NULL,
      entry_price NUMERIC NOT NULL,
      exit_price NUMERIC NOT NULL,
      pnl NUMERIC NOT NULL,
      closed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS watchlist_pairs (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pair TEXT NOT NULL,
      PRIMARY KEY (user_id, pair)
    );

    CREATE TABLE IF NOT EXISTS price_alerts (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pair TEXT NOT NULL,
      target_price NUMERIC NOT NULL,
      direction TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS postback_events (
      id SERIAL PRIMARY KEY,
      click_id TEXT,
      customer_id TEXT,
      event_name TEXT,
      trading_platform TEXT,
      country TEXT,
      event_date TEXT,
      custom1 TEXT,
      raw JSONB,
      received_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

module.exports = { pool, initSchema };
