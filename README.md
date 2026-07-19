# Forex App — Scaffold

A React Native (Expo) mobile app + Node/Express backend for a forex trading app,
built on the **legitimate model**: users connect their *own* account at a
licensed broker (e.g. AvaTrade, OANDA) — this app never holds user funds — and
you earn revenue through that broker's Introducing Broker (IB) commission
program, not by collecting deposits/withdrawals yourself.

## What's real and working right now

- **Signup / login**: real bcrypt password hashing, JWT sessions, persisted
  to a real Postgres database. Not mock UI — actually creates accounts and
  verifies credentials, and survives redeploys once hosted (see
  `DEPLOYMENT.md`).
- **Demo trading**: fully functional paper-trading loop — live-ish jittered
  prices, place buy/sell orders, track open positions, close them for real
  calculated P&L against a demo balance. Safe to publish as-is; no real money
  involved.
- **Broker connect flow**: a complete OAuth-style scaffold (authorize URL →
  broker login in a secure webview → callback → token exchange). This is
  real, working *code* — but it points at placeholder URLs until you plug in
  actual broker partner credentials (see below).

## New in this update (round 6) — real persistent database + one-click deploy

- **Migrated from the lowdb JSON file to real Postgres.** All user
  accounts, demo positions, trade history, watchlists, price alerts, and
  postback events are now stored in a proper database — nothing gets wiped
  on redeploy anymore. This is what makes signups genuinely production-real
  once deployed, not just locally.
- **`render.yaml`** — a deployment blueprint that creates the web service
  *and* a Postgres database together, pre-wired, with secrets
  auto-generated. See `DEPLOYMENT.md` for the exact click-by-click steps —
  no configuration decisions left for you to make.
- I can't push code to GitHub or click through Render's dashboard myself —
  I have no internet access in my environment — but everything is set up
  so your part is just: create a GitHub repo, upload this folder, connect
  it to Render, click Apply.

## New in this update (round 5) — deployment

- **`DEPLOYMENT.md`** — step-by-step guide to get the backend live on
  Railway or Render, with a public URL. This is required for AvaPartner
  postbacks, API token IP whitelisting, and testing the mobile app on a
  real phone.
- **Important caveat flagged there**: the current `lowdb` JSON-file database
  gets wiped on every redeploy on these platforms. Fine for initial testing;
  swap for a real Postgres database (both platforms offer one free/cheap)
  before real users sign up. Say the word and I'll migrate it.
- Added `.gitignore` files (backend + mobile) and an `engines` field in
  `package.json` so deployment platforms detect the right Node version.

## New in this update (round 4) — postback receiver, real macros

- **`GET /api/broker/postback`** now matches AvaPartner's actual macro
  format (confirmed from their "+ Add" pixel form). Set `AVA_POSTBACK_SECRET`
  in `.env` to a random string, then create pixels in AvaPartner →
  Integrations → Postback Pixels using this URL pattern, once your backend
  is deployed with a public URL:

  ```
  https://YOUR_DOMAIN/api/broker/postback?secret=YOUR_AVA_POSTBACK_SECRET&clickId={clickId}&customerId={customer_id}&eventName={eventName}&tradingPlatform={tradingPlatform}&country={countryCode}&eventDate={eventDate}
  ```

  Set up one pixel per event type you want tracked — at minimum **Signup**,
  **First Deposit**, and **First Trade** (their available event types are:
  Signup, First Deposit, First Trade, Deposit, Full Signup).
- Received events are stored and viewable at `GET /api/broker/postback-log`
  (requires login). Each entry includes clickId, customerId, eventName,
  tradingPlatform, country, and eventDate.
- The `secret` query param isn't an AvaPartner macro — it's a fixed string
  you choose, checked on arrival, so random internet traffic can't fake
  referral events pointed at your endpoint.
- **API Token** (Integrations → API Token) still requires whitelisting your
  server's public IP first — not usable from localhost.

## New in this update (round 3) — real AvaPartner integration

- **Broker connect screen now uses your real, working AvaPartner referral
  links** instead of the placeholder OAuth flow. Set `AVA_PARTNER_TAG` in
  `backend/.env` to your tag from avapartner.com → Marketing Tools → Direct
  Links, and the "Trade with real funds" screen will open real,
  commission-tracked AvaTrade signup links (WebTrader, MT4, MT5, and demo).
- **Important limitation:** this link-based referral model does not give
  your app API access to show a user's live AvaTrade balance/positions
  in-app — users trade on AvaTrade's own platform after signing up through
  your link. The original OAuth scaffold is still in `backend/routes/broker.js`
  (commented as "future/not yet available") in case AvaTrade offers you
  trading API access later — that's a separate application from the
  AvaPartner referral program.

## New in this update (round 2)

- **Watchlist**: tap the star next to any pair on the dashboard to save it (`backend/routes/watchlist.js`). Persists per-user.
- **Trade history**: every closed demo trade is now saved permanently and viewable on a dedicated screen (`HistoryScreen.js`), not just shown once and discarded.
- **App icon & splash screen**: generated to match the app's theme (dark navy background, candlestick mark, blue/green accents) — see `mobile/assets/`. Regenerate anytime with `python3 mobile/generate_assets.py`, or replace with your own branding before publishing.

## New in this update (round 1)

- **Economic calendar**: `backend/routes/calendar.js` + `CalendarScreen.js`.
  Ships with realistic mock events so the UI works today; swap in a real
  provider (Finnhub's free tier is the easiest starting point — instructions
  in the file) when ready.
- **Push notifications**: real, working Expo push integration — device
  registers a token on login (`src/api/pushNotifications.js`), backend
  stores it and can send alerts. Wired up for demo position closes; also
  supports user-created price alerts (`POST /api/notifications/price-alerts`)
  that fire automatically when a pair crosses the target price.
- **Legal templates**: `legal/privacy-policy.docx` and
  `legal/terms-of-service.docx` — drafted specifically for this app's model
  (demo trading + IB referral, never holding user funds). These are
  templates with `[bracketed placeholders]` — have a lawyer review and fill
  in your actual entity name, jurisdiction, and support contact before
  publishing to the Play Store (Google requires a real privacy policy URL).

## What you still need to do before this is a live-money app

1. **Apply to a broker's IB/partner program** (AvaTrade, OANDA, etc.) to get
   real `BROKER_CLIENT_ID` / `BROKER_CLIENT_SECRET` / API base URL.
2. **Replace the two `TODO`s in `backend/routes/broker.js`** with that
   broker's actual OAuth authorize + token-exchange endpoints (exact shape
   varies by broker — check their partner API docs).
3. **Swap the JSON file database for Postgres/MySQL** before real users sign
   up — `lowdb` here is for development only.
4. **Replace the demo/mock price feed** (`backend/routes/demo.js`) with the
   broker's real streaming price API once a user is connected live — right
   now it's simulated data for the practice mode only.
5. Legal/compliance review before publishing — data privacy policy, terms of
   service, and confirming your IB arrangement's compliance requirements in
   your jurisdiction. I can help draft these, but you'll want a lawyer to
   review before launch.

## Running it locally

**Backend** — needs a Postgres database. Easiest local options: install
Postgres directly, or run `docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres` if you have Docker.
Tables are created automatically on first run — no manual migration needed.
```
cd backend
cp .env.example .env   # fill in JWT_SECRET and DATABASE_URL at minimum
npm install
npm run dev
```

Honestly, for a non-technical setup, skip local Postgres entirely and just
deploy straight to Render (see `DEPLOYMENT.md`) — it creates the database
for you with zero setup.

**Mobile app**
```
cd mobile
npm install
npx expo start
```
Update `API_BASE_URL` in `mobile/src/api/client.js` to your machine's LAN IP
if testing on a physical device via Expo Go (`localhost` only works in a
simulator).

## Project structure

```
backend/
  routes/auth.js      → signup, login, session check
  routes/broker.js     → OAuth-style broker connection scaffold
  routes/demo.js        → paper trading (prices, orders, positions)
  models/User.js         → password hashing, user storage
  middleware/auth.js      → JWT verification

mobile/
  src/screens/            → Login, Signup, Dashboard, BrokerConnect
  src/context/AuthContext.js → session state across the app
  src/api/client.js          → typed wrapper around backend endpoints
  src/theme/theme.js          → design tokens (colors, type, spacing)
```
