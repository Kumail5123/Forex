const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const SALT_ROUNDS = 10;

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    demoBalance: Number(row.demo_balance),
    brokerConnected: row.broker_connected,
    expoPushToken: row.expo_push_token,
    createdAt: row.created_at,
  };
}

async function createUser({ email, password, fullName }) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    const err = new Error('An account with this email already exists.');
    err.code = 'USER_EXISTS';
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO users (id, email, full_name, password_hash)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, email.toLowerCase(), fullName, passwordHash]
  );

  return rowToUser(result.rows[0]);
}

async function verifyCredentials(email, password) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const row = result.rows[0];
  if (!row) return null;

  const isMatch = await bcrypt.compare(password, row.password_hash);
  if (!isMatch) return null;

  return rowToUser(row);
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rowToUser(result.rows[0]);
}

async function setPushToken(id, expoPushToken) {
  await pool.query('UPDATE users SET expo_push_token = $1 WHERE id = $2', [expoPushToken, id]);
}

async function setBrokerConnected(id, connected) {
  await pool.query('UPDATE users SET broker_connected = $1 WHERE id = $2', [connected, id]);
}

async function updateDemoBalance(id, newBalance) {
  await pool.query('UPDATE users SET demo_balance = $1 WHERE id = $2', [newBalance, id]);
}

module.exports = {
  createUser,
  verifyCredentials,
  findById,
  setPushToken,
  setBrokerConnected,
  updateDemoBalance,
};
