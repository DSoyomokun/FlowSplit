# FlowSplit — Expo Go Network Setup

> **TL;DR:** Every time you come back to this project:
> 1. **Unpause Supabase** at supabase.com/dashboard (free tier pauses after ~1 week idle)
> 2. Your Mac's Tailscale IP may have changed — check it, update `.env`
> 3. Restart Expo with `--clear` and make sure Tailscale is active on your phone

---

## Why "Network Failed" Keeps Happening

FlowSplit's mobile app talks to a FastAPI backend running locally on your Mac.
Expo Go on a **physical device** cannot use `localhost` — it needs a real IP address it can route to.

Your Mac has **no regular LAN IP on `en0`** — only a Tailscale VPN IP (`100.70.x.x`).
That IP is assigned by the Tailscale network and **changes periodically** (e.g. after a system reboot or Tailscale restart).

So after any break in work you may have:
- A stale IP in `mobile/.env`
- A stale IP baked into Metro's module cache
- Tailscale disconnected on your phone

Any one of these causes "Network request failed".

---

## The Fix (every time you return to the project)

### Step 0 — Unpause Supabase

Supabase **pauses free-tier projects after ~1 week of inactivity**. When paused, all auth requests fail silently — the app reaches your backend fine but Supabase rejects every token, causing 401s or login failures.

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Find your project — it will show a "Paused" badge
3. Click **Restore project** and wait 1–2 minutes

You'll know it's back when the Supabase dashboard shows green and login works again.

---

### Step 1 — Find your current Mac Tailscale IP

```bash
ipconfig getifaddr en0
```

Example output: `100.70.114.69`

### Step 2 — Update `mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://<YOUR_IP>:8000/api/v1
```

Example:
```env
EXPO_PUBLIC_API_URL=http://100.70.114.69:8000/api/v1
```

### Step 3 — Start the backend

```bash
cd /Users/dstatic/Downloads/FlowSplit/backend/src
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Must be started from the `src/` directory. The `.env` is loaded from the parent (`backend/.env`).

### Step 4 — Restart Expo with cache cleared

```bash
cd /Users/dstatic/Downloads/FlowSplit/mobile
npx expo start --clear
```

The `--clear` flag is essential — without it, Metro may serve the old IP from its module cache even after you update `.env`.

### Step 5 — Check Tailscale on your phone

Open the **Tailscale app** on your iPhone and confirm:
- You are signed in
- The toggle is **ON** (connected)

If Tailscale is off on the phone, it cannot route to the `100.70.x.x` address and every request fails.

---

## Quick Verification

After starting the backend, confirm it's reachable from your Mac:

```bash
curl http://100.70.114.69:8000/api/v1/users/me
# Expected: {"detail":"Not authenticated"}  ← means the server is up and routing correctly
```

If this returns "Not authenticated" you're good. If it times out, the backend isn't running or the IP is wrong.

---

## Alternative: ngrok (when Tailscale on phone isn't an option)

If you can't install Tailscale on your phone (e.g. testing on a borrowed device):

```bash
ngrok http 8000
# Copy the https URL, e.g. https://abc123.ngrok-free.app
```

Then update `.env`:
```env
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app/api/v1
```

Restart Expo with `--clear` as usual. The ngrok URL changes every session unless you're on a paid plan.

---

## Checklist Summary

| # | Check | Command / Action |
|---|-------|-----------------|
| 0 | Unpause Supabase | supabase.com/dashboard → Restore project |
| 1 | Get current IP | `ipconfig getifaddr en0` |
| 2 | Update `mobile/.env` | Set `EXPO_PUBLIC_API_URL=http://<IP>:8000/api/v1` |
| 3 | Start backend | `cd backend/src && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` |
| 4 | Start Expo (clear cache) | `cd mobile && npx expo start --clear` |
| 5 | Tailscale on phone | Open app → confirm toggle is ON |
| 6 | Verify backend | `curl http://<IP>:8000/api/v1/users/me` → "Not authenticated" |
