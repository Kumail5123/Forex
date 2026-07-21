import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://forex-app-backend.onrender.com/api';

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await AsyncStorage.getItem('authToken');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }

  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  getBrokerLinks: () => request('/broker/links'),
  getBrokerStatus: () => request('/broker/status'),
  markBrokerConnected: () => request('/broker/mark-connected', { method: 'POST' }),
  disconnectBroker: () => request('/broker/disconnect', { method: 'DELETE' }),

  getDemoPrices: () => request('/demo/prices'),
  getDemoPositions: () => request('/demo/positions'),
  placeDemoOrder: (payload) => request('/demo/order', { method: 'POST', body: payload }),
  closeDemoPosition: (id) => request(`/demo/close/${id}`, { method: 'POST' }),
  getTradeHistory: () => request('/demo/history'),
  getCandles: (pair, count = 50) => request(`/demo/candles?pair=${pair}&count=${count}`),
  getPendingOrders: () => request('/demo/pending-orders'),
  cancelPendingOrder: (id) => request(`/demo/pending-orders/${id}`, { method: 'DELETE' }),

  getWatchlist: () => request('/watchlist'),
  addToWatchlist: (pair) => request('/watchlist', { method: 'POST', body: { pair } }),
  removeFromWatchlist: (pair) => request(`/watchlist/${pair}`, { method: 'DELETE' }),

  getCalendarEvents: () => request('/calendar/events'),

  registerPushToken: (expoPushToken) => request('/notifications/register-token', { method: 'POST', body: { expoPushToken } }),
  getPriceAlerts: () => request('/notifications/price-alerts'),
  createPriceAlert: (payload) => request('/notifications/price-alerts', { method: 'POST', body: payload }),
  deletePriceAlert: (id) => request(`/notifications/price-alerts/${id}`, { method: 'DELETE' }),
};
