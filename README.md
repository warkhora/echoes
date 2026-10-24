# Echoes — v1.0.0

A minimalist, "Liquid Glass" web client for Spotify. Translucent surfaces, an ambient colour
field that re-lights with whatever is playing, and a calm, distraction-free listening shell.

> **v1.0.0 scope** — visual design system, liquid-glass components, motion language, Spotify
> PKCE auth and library/playback data plumbing. The full audio engine (Web Playback SDK,
> crossfade, queue editor) lands in **v1.1.0**.

---

## 1. Quick start

```bash
# 1 — install dependencies (framer-motion + lucide-react are already in package.json)
npm install

# 2 — environment
cp .env.example .env.local
#   NEXT_PUBLIC_SPOTIFY_CLIENT_ID=xxxxxxxxxxxxxxxx   ← from developer.spotify.com/dashboard
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db

# 3 — create the tables (first run seeds the demo catalog automatically)
npx drizzle-kit push

# 4 — run
npm run dev          # http://localhost:3000
npm run build && npm start
```

**Redirect URI** — whitelist exactly what the app runs on, e.g. `http://localhost:3000/`
plus your production origin. Override it with `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI` if needed.

**No client id?** Echoes boots into **Demo Mode**: the entire interface runs against a local
Postgres catalog (16 tracks, 6 playlists, 8 artists) so every surface is explorable — the
transport is simulated and every play is still written to the database.

---

## 2. Folder structure

```
src/
├─ app/
│  ├─ layout.tsx                  # fonts, metadata, theme-color, favicon
│  ├─ page.tsx                    # provider stack + app shell + boot/login gate
│  ├─ globals.css                 # ⭐ the Liquid Glass design system
│  └─ api/
│     ├─ catalog/route.ts         # GET demo library (tracks/playlists/artists/recent/top)
│     ├─ playback/route.ts        # GET log + stats · POST listening event
│     ├─ preferences/route.ts     # GET / PUT personalization (persisted)
│     └─ tracks/[id]/saved/route.ts
├─ components/
│  ├─ AmbientField.tsx            # drifting blooms + turbulence-displaced liquid mesh + grain
│  ├─ AccentDriver.tsx            # writes --accent-1/2/3 to :root (theme or artwork sync)
│  ├─ AlbumArt.tsx                # procedural SVG sleeves / Ken Burns for real artwork
│  ├─ GlassCard.tsx               # glass atom: sheen (pointer-tracked) + hover lift
│  ├─ Sidebar.tsx  TopBar.tsx  PlayerBar.tsx  PersonalizationDrawer.tsx
│  ├─ TrackRow.tsx  LoginScreen.tsx  motion.tsx   # ScrambleText / Reveal / MaskedHeading / Equalizer / CountUp
│  └─ views/                      # HomeView · PlaylistsView · SavedView · ActivityView
├─ hooks/useSpotifyAuth.ts        # PKCE boot, callback exchange, refresh, logout
├─ lib/
│  ├─ spotify/auth.ts             # ⭐ PKCE primitives (verifier, challenge, token, storage)
│  ├─ spotify/client.ts           # fetch wrapper + Spotify → Echo adapters
│  ├─ color.ts                    # artwork palette extraction (canvas, CORS-safe)
│  ├─ navigation.ts  types.ts  server/stats.ts
├─ state/
│  ├─ preferences.tsx             # blur/theme/motion, localStorage + debounced Postgres write
│  ├─ library.tsx                 # demo catalog ⇄ Spotify library, saved-state, paging
│  └─ player.tsx                  # dual transport: simulated demo engine + live /v1/me/player
└─ db/schema.ts  db/seed.ts  db/index.ts
```

---

## 3. The Liquid Glass system

Everything translucent reads from a handful of CSS custom properties, so one slider can
re-tune the whole product.

| Token | Default | Meaning |
| --- | --- | --- |
| `--glass-blur` | `26px` | `backdrop-filter` radius for every surface (10–50 via the drawer) |
| `--glass-border` | `rgba(255,255,255,.12)` | ultra-thin 1px edge |
| `--glass-fill-a/b` | `.085 / .022` | diagonal wash inside the pane |
| `--accent-1/2/3` | theme triad | blooms, glows, progress gradient, focus rings |
| `--accent-glow` | accent @45% | hover shadows and bloom halos |

Utilities (Tailwind v4 `@utility`): `glass`, `glass-thin`, `sheen` (a specular highlight that
follows the cursor via `--mx/--my`), `lift`, `thin-scrollbar`, `fade-mask-r`, `grain`,
`skeleton`, `tnum`, `eq-bar`.

**Motion signature** — morphing turbulence mesh, drifting blooms, Ken Burns artwork breathing,
scramble-decode titles on track change, line-mask heading reveals, `layoutId` nav pill,
spring drawer, stacked pinned sleeves in the hero. All of it collapses under
`prefers-reduced-motion` and under the in-app **Fluid motion** toggle (`data-motion="calm"`).

---

## 4. Authentication (PKCE)

`lib/spotify/auth.ts` implements the public-client flow end to end:

1. `beginLogin()` → 64-char verifier + random state → `sessionStorage`, SHA-256 → S256 challenge → redirect.
2. On return, `readCallbackParams()` grabs `?code=`, `exchangeCodeForToken()` swaps it at
   `accounts.spotify.com/api/token` (no secret), then the URL is cleaned with `history.replaceState`.
3. The session lives in `localStorage` (`echoes.spotify.session.v1`) with an `expiresAt`
   already trimmed by 45s. `useSpotifyAuth.getAccessToken()` transparently refreshes, and a
   45s timer renews tokens before they lapse.
4. `logout()` clears storage and drops back to Demo Mode.

### Embedded previews (Arena / any iframe host)

`accounts.spotify.com` sends `X-Frame-Options: DENY`, so the consent screen can never render
inside a preview iframe. `beginLogin()` therefore never navigates the frame:

1. It detects framing (`window.self !== window.top`) and navigates **`window.top.location.href`**
   (falling back to `window.parent.location.href`) to `${appUrl}?echoes_auth=1` — a *relay hop*
   that lifts Echoes itself to the top level.
2. The relay hop exists because iframe storage is **partitioned**: a verifier written inside the
   frame would be unreadable after Spotify bounces the top window back to the app. At the top
   level the verifier is dual-written to `sessionStorage` + `localStorage`.
3. That unpartitioned instance strips the flag, builds the S256 challenge, and navigates the top
   window to `accounts.spotify.com/authorize`.
4. On return, `verifyCallbackState()` checks `state` and `exchangeCodeForToken()` swaps the code.
5. If the host frame forbids top navigation (`sandbox` without `allow-top-navigation`), the login
   screen surfaces an explicit **“Open Echoes in its own tab”** action instead of failing silently.

Scopes requested: playback read + modify, currently-playing, recently-played, top items,
library read/modify, playlist read, private/email, streaming.

---

## 5. Data & persistence

* **Demo Mode** → `/api/catalog` (Drizzle → Postgres). Idempotent first-run seed in `db/seed.ts`.
* **Spotify Mode** → `/me/playlists`, `/me/player/recently-played`, `/me/top/tracks|artists`,
  `/me/tracks`, and lazy `/playlists/{id}/tracks` paging; all normalized through the
  `adaptTrack / adaptPlaylist / adaptArtist` mappers into one internal shape (`lib/types.ts`).
* **Playback** → the demo transport ticks at 200ms and posts a listening event once a track
  passes 20s or completes. Spotify mode polls `/v1/me/player` (5s playing / 20s paused),
  interpolates the progress bar between polls, and drives `play · pause · next · previous ·
  seek · volume · shuffle · repeat`.
* **Personalization** → optimistic `localStorage`, debounced `PUT /api/preferences`.

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/catalog` | GET | demo library + recently played + top tracks + stats |
| `/api/playback` | GET, POST | listening log, aggregate stats, telemetry writes |
| `/api/preferences` | GET, PUT | personalization profile |
| `/api/tracks/[id]/saved` | PUT | saved/liked toggle |
| `/api/health` | GET | DB liveness probe |

---

## 6. Keyboard

`Space` play/pause · `←/→` seek 5s · `Shift + ←/→` previous/next · `P` personalization ·
`Esc` close drawer.
