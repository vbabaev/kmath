# KLearn Backend — Design & Execution Plan

> Historical design doc (project was originally named "KMath" — references to
> `kmath.*` localStorage keys, `kmath-backup-*.json` files, and the `kmath`
> MongoDB database describe the pre-rename state. The live system now uses
> `klearn.*` everywhere; see CLAUDE.md for current behaviour.)


> Replace localStorage with a MongoDB-backed Node.js API. Three-container deployment (frontend, backend, db) behind Caddy at `klearn.vbabaev.uk`. Google OAuth gated by a local allowlist arrives in a later phase.

## 1. Goals

- **Backend is the source of truth.** All profile state (points, sessions, packages, assignments, activeQuiz, settings) lives in Mongo. The client only holds an auth identity for making calls.
- **Cross-device continuity.** Kira can start a quiz on the iPad and finish it on the laptop; Dad's "Mark used" on the shop reflects everywhere.
- **Phase-friendly.** Ship a usable backend with no auth first. Add Google OAuth + allowlist as a discrete later phase without reshaping the data model.
- **Three production containers.** `frontend` (Caddy serving the static React build + reverse-proxying `/api`), `backend` (Node.js), `mongo`.

### Non-goals (for now)

- Multi-tenant / multi-household support — this is a single-family install.
- Realtime sync (no WebSockets / SSE). Polling on screen mount is enough.
- Horizontal scaling. Single backend instance is fine.

## 2. Architecture

```
                 ┌──────────────────────────────────────────┐
   browser  ───► │  Caddy container (klearn.vbabaev.uk)      │
   HTTPS         │  • serves /            → ./dist (static)│
                 │  • proxies /api/*      → backend:3000   │
                 │  • Let's Encrypt auto-renew              │
                 └──────────────┬───────────────────────────┘
                                │ docker internal network
                  ┌─────────────┴───────────┐
                  ▼                         ▼
      ┌───────────────────┐       ┌───────────────────┐
      │  backend (Node)   │ ───►  │  mongo (mongo:7)  │
      │  Express + driver │       │  named volume     │
      └───────────────────┘       └───────────────────┘
```

- **Caddy doubles as the "frontend container"** — it serves the built React assets and reverse-proxies `/api` to the backend. One TLS cert, no CORS.
- **Mongo is never exposed to the host network in production** — only the backend talks to it via the docker-compose service name.
- **Local dev** runs only `mongo` in a container; frontend (`npm run dev`) and backend (`npm run dev` with nodemon) run on the host for fast iteration.

## 3. Data Model

One document per profile in a single `profiles` collection. The document mirrors today's `profile` shape from `src/profiles.js` so that migration is a copy-paste.

```js
// profiles collection — _id is the existing seeded profile id ("dad" | "kira" | "test")
{
  _id: "kira",
  name: "Kira",
  emoji: "👧",
  color: "pink",
  role: "student",                 // "teacher" | "student"
  settings: { group: "school" },
  points: 1240,
  sessions: [ /* SessionEntry[], append-only */ ],
  packages: [ /* Package[] */ ],
  assignments: [ /* Assignment[] — FIFO queue */ ],
  activeQuiz: null,                // or the recovery snapshot
  googleEmail: null,               // populated in Phase 5; null in MVP
  createdAt: ISODate,
  updatedAt: ISODate,              // bumped on every write — used for optimistic concurrency later
  schemaVersion: 1
}
```

### Indexes
- `_id` (default).
- `googleEmail` (sparse, unique) — used by the auth callback to map a Google login back to a profile. Added when Phase 5 lands.

### Why a single collection (not normalized)
- Reads are always "fetch one whole profile by id" — no joins.
- Writes are always scoped to one profile.
- Document size budget: even with 1000 sessions × ~500 bytes ≈ 500 KB, well under Mongo's 16 MB doc limit.
- If sessions ever explode (year 3+), split `sessions` into its own collection without touching the API.

## 4. API Surface

All routes are under `/api`. Authentication header during MVP is `X-Profile-Id: <id>`; Phase 5 replaces this with a session cookie.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`  | `/api/profiles` | List profiles (id, name, emoji, color, role) — for the picker. |
| `GET`  | `/api/profiles/:id` | Read full profile document. |
| `PUT`  | `/api/profiles/:id` | Replace the full profile. Server validates invariants (see below). |
| `GET`  | `/api/health` | `{ ok: true }` for Caddy / monitoring. |

**Why just `PUT`?** You picked "full profile snapshot" — the simplest mental model. Client mutates a local copy, then PUTs the whole thing. The frontend functions in `profiles.js` (`addSessionToProfile`, `buyPackage`, `setActiveQuiz`, …) become thin wrappers: read → mutate → PUT.

### Server-side invariants (enforced on PUT)
- `points >= 0`. Negative values clamped to 0.
- `sessions` is append-only. The new array must be a prefix-superset of the existing one (same items at the same indices, only new entries appended). Violations → `409 Conflict`.
- `packages[].id` immutable; `status` and `usedAt` are the only mutable fields.
- `role` cannot be changed by the client.
- `_id` cannot be changed.
- Unknown fields stripped.

### Optimistic concurrency (Phase 2)
- Response includes `ETag: "<updatedAt iso>"`.
- `PUT` requires `If-Match`. Mismatch → `409`. Client refetches and replays the user's intent.
- Defer until we observe a real conflict in practice.

### Validation
- Use `zod` to validate request bodies. The schema lives next to the data model in `backend/src/schema.js` and is the single source of truth for "what a profile looks like."

## 5. Backend Stack

- **Runtime:** Node.js 22 LTS.
- **Framework:** Express 5 (small surface, well-known, plenty of examples for OAuth).
- **DB driver:** `mongodb` native (no Mongoose — the schema is mostly stable shape definitions, and zod handles validation better than Mongoose schemas).
- **Validation:** `zod`.
- **Logging:** `pino` + `pino-http`.
- **Env config:** `dotenv` (loaded only outside production; in prod, env comes from docker-compose).
- **Security middleware:** `helmet`, `express-rate-limit` (per-IP, generous).
- **Auth middleware (MVP):** trivial — reads `X-Profile-Id`, attaches to `req.profileId`. Phase 5 replaces with passport-google-oauth20 + session cookie.

### Project layout

```
backend/
  package.json
  Dockerfile
  .dockerignore
  src/
    index.js              # bootstrap: connect to mongo, start express
    config.js             # env vars, validates required ones at boot
    db.js                 # mongo client + collection getters
    auth.js               # MVP: X-Profile-Id middleware. Phase 5: passport setup.
    schema.js             # zod profile schema + invariant checks
    routes/
      profiles.js         # GET /, GET /:id, PUT /:id
      health.js
    seed.js               # one-shot: insert default profiles if empty
    import-backup.js      # one-shot: ingest the kmath-backup-*.json file
  test/
    profiles.test.js      # supertest + ephemeral mongo
```

## 6. Frontend Refactor

The cleanest move is to keep the API surface of `src/profiles.js` and `src/settings.js` but flip every function from sync to async. Every consumer in the React tree gets `await` and a loading state.

### `src/api.js` (new)

```js
const BASE = import.meta.env.VITE_API_BASE || "/api";
function profileId() { return localStorage.getItem("kmath.profileId"); }

export async function apiGet(path) {
  const r = await fetch(`${BASE}${path}`, { headers: { "X-Profile-Id": profileId() ?? "" }});
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}
export async function apiPut(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Profile-Id": profileId() ?? "" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}
```

### `src/profiles.js` (rewrite)

Same exports — `getActiveProfile()`, `saveProfile()`, `addSessionToProfile()`, `buyPackage()`, `setActiveQuiz()`, `consumeActiveAssignment()`, etc. — but each one becomes an async fetch + PUT. Helpers like `isTeacher()`, `getProfileColors()`, `SHOP_PACKAGES` stay pure / sync.

### `src/settings.js` (rewrite)
- Today: stores `{ activeProfile }` in localStorage.
- MVP (no auth): keep `activeProfile` id in localStorage as the only client-side state. It's identity, not data.
- Phase 5 (Google auth): the backend session cookie identifies the user; `activeProfile` is derived from the allowlist, not stored client-side. Teacher's "view as student" UX is a distinct future feature.

### App.jsx
- Add a `loading` and `error` screen state.
- `enterProfile`, `refreshProfile`, `selectProfile`, `finishQuiz`, `cancelQuiz`, `playAgain`, `startAssignment`, `assignCustomMix`, `handleBuyPackage`, `handleSetPackageStatus` all become async. The screen state transitions stay the same; we just await the API call.
- Quiz auto-save (currently writes `profile.activeQuiz` to localStorage on every meaningful change) becomes a debounced PUT (~750 ms after the last change) plus an explicit save via `navigator.sendBeacon` on `pagehide` for tab-close.

### What does NOT change
- Module interface, problem generation, scoring, dedup logic — pure client.
- The shape of every persisted entity (Profile, Session, Package, Assignment, ActiveQuiz). The server stores them verbatim.
- Tailwind classes / UI / quiz flow / shop UX.

## 7. Auth — MVP and Phase 5

### MVP (no Google login)
- The client picks a profile via the existing `ProfilePicker` and stores the id in `localStorage["kmath.profileId"]`.
- The backend reads `X-Profile-Id` and uses it as `req.profileId`. **It does not verify identity.** This is fine for a local home install but must not be exposed to the public internet without auth.
- The Caddy site is therefore behind HTTP basic auth or a static IP allowlist until Phase 5 lands. (Decision needed — see Open Questions.)

### Phase 5 (Google OAuth)
- `passport-google-oauth20` strategy.
- `backend/auth-allowlist.json` (gitignored, deploy-time secret):
  ```json
  {
    "dad@example.com":  { "profileId": "dad",  "role": "teacher" },
    "kira@example.com": { "profileId": "kira", "role": "student" }
  }
  ```
- OAuth callback: look up email in allowlist; if absent → 403. Otherwise create a session containing `{ profileId, role }`. Persist `googleEmail` on the profile document on first successful login.
- Express session middleware with HttpOnly + Secure + SameSite=Lax cookies. Same domain, so SameSite=Lax is plenty.
- The `X-Profile-Id` header path is removed.
- `test` profile keeps a dev-only login: `ALLOW_DEV_LOGIN=true` env var on the backend exposes a `POST /api/auth/dev-login` that accepts a profile id. Off by default in production.

### Authorization (Phase 5+)
- Students: can only `GET`/`PUT` their own profile.
- Teachers: can `GET` all profiles, can `PUT` to a student's profile **only** to add an assignment or toggle a package status. A `req.actor` vs `req.targetProfile` split keeps this clean.

## 8. Containers

### `backend/Dockerfile`

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
USER node
EXPOSE 3000
CMD ["node", "src/index.js"]
```

### `Caddyfile` (production)

```
klearn.vbabaev.uk {
  encode gzip
  root * /srv/dist
  handle /api/* {
    reverse_proxy backend:3000
  }
  handle {
    try_files {path} /index.html
    file_server
  }
  log
}
```

### `docker-compose.yml` (production, lives at repo root)

```yaml
services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    volumes:
      - mongo-data:/data/db
    networks: [internal]

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      MONGO_URL: mongodb://mongo:27017/kmath
      NODE_ENV: production
      ALLOW_DEV_LOGIN: "false"
    depends_on: [mongo]
    networks: [internal]

  frontend:
    image: caddy:2
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./dist:/srv/dist:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on: [backend]
    networks: [internal]

volumes:
  mongo-data:
  caddy-data:
  caddy-config:

networks:
  internal:
```

### `docker-compose.dev.yml` (local development)

```yaml
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]    # exposed locally so the host backend can reach it
    volumes:
      - mongo-dev:/data/db

volumes:
  mongo-dev:
```

Local workflow: `docker compose -f docker-compose.dev.yml up -d` for Mongo, then `npm run dev` in `backend/` (nodemon, port 3000) and `npm run dev` at the repo root (Vite, port 5173, with `VITE_API_BASE=http://localhost:3000/api`).

## 9. Migration from localStorage

You already exported `kmath-backup-<date>.json` via the console snippet. The shape is `{ "kmath.settings": { activeProfile }, "kmath.profile.dad": {...}, "kmath.profile.kira": {...}, ... }`.

`backend/src/import-backup.js`:
1. Read the JSON file from a path passed via CLI arg.
2. For each key starting with `kmath.profile.`: upsert into `profiles` with `_id` = key suffix.
3. Skip `kmath.settings` (UI-only).
4. Set `schemaVersion: 1`, `createdAt`/`updatedAt` to now if missing.
5. Print a summary: `{ imported: N, skipped: M }`.

Run it once on the production host after the backend is up: `docker compose run --rm backend node src/import-backup.js /backup.json`.

## 10. Execution Plan

Phased, each phase shippable. Roughly 5 working sessions.

### Phase 0 — Repo skeleton
- Create `backend/` with `package.json`, empty `src/index.js` that boots Express on 3000.
- Create `docker-compose.dev.yml` with Mongo only.
- Create `.env.example` for the backend (`MONGO_URL`, `PORT`, `NODE_ENV`).
- `.gitignore` updates: `backend/node_modules`, `backend/.env`, `auth-allowlist.json`.

### Phase 1 — Backend MVP
- Mongo connection module + health check route.
- Profile zod schema.
- Routes: `GET /api/profiles`, `GET /api/profiles/:id`, `PUT /api/profiles/:id` with invariant enforcement.
- `X-Profile-Id` middleware (rejects requests where header is missing or doesn't match `:id`).
- `seed.js` — inserts default profiles if collection is empty.
- `import-backup.js` — ingests the JSON backup.
- Tests with `supertest` and an ephemeral Mongo (testcontainers or `mongodb-memory-server`).

### Phase 2 — Frontend wiring
- Add `src/api.js`.
- Rewrite `src/profiles.js` and `src/settings.js` (async, network-backed). Same exported names.
- Add a top-level `<AppLoading>` placeholder; show while initial profile fetch is in flight.
- Replace localStorage reads with awaited fetches in `App.jsx` and screens.
- Quiz auto-save: debounced `PUT /api/profiles/:id` + `sendBeacon` on `pagehide`.
- Manual smoke test of every flow: profile pick, quick quiz, custom mix, finish, cancel, F5 mid-quiz, switch profile, shop buy, teacher assign, teacher mark-used.
- Update `CLAUDE.md` to reflect that storage is now backend-driven.

### Phase 3 — Production containers
- Write `backend/Dockerfile`.
- Write `Caddyfile`.
- Write top-level `docker-compose.yml` (prod).
- On `klearn.vbabaev.uk`: install Docker + Compose, clone repo, copy `.env`, run `npm run build` for the frontend, `docker compose up -d`, run `import-backup.js`.
- Verify the live URL serves the app and `/api/health` returns 200.
- **Decide on interim auth gate** before exposing publicly (see Open Questions).

### Phase 4 — Hardening
- Optimistic concurrency (`ETag` / `If-Match`).
- Rate limiting tuned for the household (generous; primarily DoS protection).
- Backup script: `mongodump` to a host directory, run nightly via cron on the host.
- Pino log rotation (or just rely on `docker logs` + log driver settings).

### Phase 5 — Google OAuth + allowlist
- `passport-google-oauth20` integration.
- `backend/auth-allowlist.json` deploy-time file.
- Replace `X-Profile-Id` middleware with session-cookie middleware.
- Login page on the frontend (replaces direct profile picker for non-dev users).
- Migrate existing profiles: set `googleEmail` on first login by matching the allowlist.
- Remove the interim Caddy auth gate once OAuth is live.
- Optional: dev-only `POST /api/auth/dev-login` for the `test` profile, gated by `ALLOW_DEV_LOGIN=true`.

### Phase 6 — Authorization split (teachers vs students)
- Refine route handlers so a teacher can read all profiles and write only assignments + package status to students.
- Make the "Switch profile" button visible only when the logged-in user has multi-profile access (i.e. dev mode).

## 11. Open Questions

1. ~~**Interim auth gate (Phase 3 → Phase 5)**~~ — **Decided:** no gating in the interim. The data isn't sensitive and a guessed profile id at most reveals quiz history. Phase 5 (Google OAuth + allowlist) adds real auth.
2. **Where does `auth-allowlist.json` live in production?** Bind-mounted from a path on the host that's outside the repo, or a docker secret?
3. **Backups: keep on the host, or push to S3 / similar?**
4. **Test profile after auth:** dev-login env flag, or a hardcoded fallback Google account, or just delete the `test` profile in production?

## 12. Risks & Mitigations

- **Every UI action becomes async.** The kid notices latency on a slow network. Mitigation: optimistic UI updates — show the new state immediately, reconcile on response. Keep the API local (same domain, same continent) so RTT stays sub-50ms.
- **Lost data during migration.** Mitigation: run `import-backup.js` once, then keep the JSON file. Don't delete localStorage from any browser until you've verified the backend has everything (it'll be obvious — the heatmap and points would be wrong).
- **Tab-close during quiz.** With localStorage, the snapshot is synchronous. With backend, `sendBeacon` on `pagehide` is fire-and-forget — usually delivered, occasionally not. Acceptable: the kid loses at most one in-flight question.
- **Schema drift.** If we change the profile shape, every existing document needs to migrate. Mitigation: `schemaVersion` field + an idempotent `migrate.js` that runs on backend boot.
- **Single backend instance is a SPOF.** Acceptable for a household app. `docker compose up -d` recovery time is ~5 seconds.

## 13. What this doc replaces / supplements

- This is the canonical design for the backend cutover. When Phase 1 ships, update §3 and §4 with whatever drifted from this plan. When Phase 5 ships, replace §7's MVP section with the actually-shipped flow.
- `CLAUDE.md` will get a short "Storage" section at Phase 2 — pointing here, and noting that `localStorage` is no longer the source of truth.
