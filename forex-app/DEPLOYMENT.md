# Deploying the backend

This gets you a public URL — required for AvaPartner postbacks, API token
whitelisting, real user signups from anywhere, and testing the mobile app
on a real phone (not just a simulator).

I've pre-configured everything I can — including a real, persistent
**Postgres database** (not a file that resets) — so there are as few
decisions left as possible. This still needs to be done from your own
GitHub/Render accounts — I have no internet access in my environment, so I
can't push code or click through their dashboards myself. Follow these
exact steps and you shouldn't hit any decision points I haven't already
made for you.

## Steps

**Step 1 — Put the code on GitHub** (Render deploys from a GitHub repo)
1. Go to github.com, log in (or create a free account)
2. Click the **+** in the top right → **New repository**
3. Name it anything (e.g. `forex-app`), Public or Private either fine,
   click **Create repository**
4. On the next page, click **uploading an existing file**
5. Drag in the entire `forex-app` folder from this zip
6. Scroll down, click **Commit changes**

**Step 2 — Deploy on Render**
1. Go to render.com → sign up (free — can use your GitHub login)
2. Click **New +** → **Blueprint**
3. Connect the GitHub repo you just created
4. Render detects `render.yaml` automatically and shows you what it's
   about to create: **one web service + one Postgres database**, already
   wired together. Secrets (`JWT_SECRET`, `AVA_POSTBACK_SECRET`) are
   auto-generated — no typing required.
5. Click **Apply** — Render builds and deploys it (takes 3-7 minutes,
   database included)
6. When it's done, you'll see a URL like `https://forex-app-backend.onrender.com`

**Step 3 — Test it worked**
Open `https://YOUR-URL.onrender.com/health` in a browser — you should see
`{"ok":true}`. If you see that, real users can sign up through this URL
from anywhere, and their accounts persist for good — no data loss on
future redeploys, since it's a real database now, not a file.

**Step 4 — Tell me your URL**
Paste it here and I'll update the mobile app's `API_BASE_URL` and give you
the exact AvaPartner postback URLs to paste in, with your real domain
filled in.

## Notes

- **Free tier sleep**: Render's free web service tier spins down after 15
  minutes of no traffic and takes ~30-60 seconds to wake back up on the
  next request. Fine for testing; if this matters for a live app, their
  paid tier ($7/mo) removes it.
- **Static IP for AvaPartner's API Token whitelist**: Render's free tier
  URL doesn't have one fixed IP by default. If AvaPartner's API Token
  feature requires whitelisting a single static IP, Render has a paid
  add-on for that — not needed for the Postback Pixel flow, only for
  the separate API Token/reporting feature.
