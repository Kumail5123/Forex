// Central list of tradable instruments. Adding a symbol here makes it
// available across demo trading, charts, market browsing, and watchlists.
const INSTRUMENTS = {
  // Forex
  EURUSD: { base: 1.0842, category: 'Forex', name: 'Euro / US Dollar' },
  GBPUSD: { base: 1.2673, category: 'Forex', name: 'British Pound / US Dollar' },
  USDJPY: { base: 156.21, category: 'Forex', name: 'US Dollar / Japanese Yen' },
  AUDUSD: { base: 0.6591, category: 'Forex', name: 'Australian Dollar / US Dollar' },
  USDCAD: { base: 1.3702, category: 'Forex', name: 'US Dollar / Canadian Dollar' },
  USDCHF: { base: 0.8845, category: 'Forex', name: 'US Dollar / Swiss Franc' },

  // Crypto (illustrative demo prices — not live market data)
  BTCUSD: { base: 64200, category: 'Crypto', name: 'Bitcoin' },
  ETHUSD: { base: 3180, category: 'Crypto', name: 'Ethereum' },
  SOLUSD: { base: 142, category: 'Crypto', name: 'Solana' },

  // Stocks (illustrative demo prices — not live market data)
  AAPL: { base: 227.5, category: 'Stocks', name: 'Apple Inc.' },
  TSLA: { base: 248.3, category: 'Stocks', name: 'Tesla Inc.' },
  MSFT: { base: 421.9, category: 'Stocks', name: 'Microsoft Corp.' },

  // Indices (illustrative demo prices — not live market data)
  US30: { base: 39850, category: 'Indices', name: 'Dow Jones 30' },
  SPX500: { base: 5320, category: 'Indices', name: 'S&P 500' },
};

const CATEGORIES = ['Forex', 'Crypto', 'Stocks', 'Indices'];

function priceWithJitter(base) {
  const jitter = (Math.random() - 0.5) * base * 0.0006;
  return Number((base + jitter).toFixed(base > 100 ? 2 : 5));
}

module.exports = { INSTRUMENTS, CATEGORIES, priceWithJitter };
