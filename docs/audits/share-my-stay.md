# Share My Stay (BNHUB) — audit & implementation

## Feature overview

Guests can **temporarily** share **stay status** and optionally **last-known location** with a trusted contact via an **unguessable URL**. Sharing is **off by default**, **explicitly started** by the guest, **visible while active**, **stoppable anytime**, and **auto-expires**. The public page exposes **minimal read-only data** (no payment, emails, or internal IDs).

**MVP limitations:** no background tracking, no location history (single latest point only), no auto-email to recipients unless added later.

---

## Schema (Prisma)

Tables map to Postgres as snake_case. Prisma **enum members use UPPER_SNAKE_CASE** (required by Prisma Client); they correspond conceptually to the product enums (`active` → `ACTIVE`, etc.).

| Table | Purpose |
|--------|---------|
| `share_sessions` | Lifecycle, **hashed** public token, status, share mode, last lat/lng, timestamps |
| `share_recipients` | Recipient type (`EMAIL` / `LINK_ONLY`), optional encrypted value, display label |
| `share_audit_events` | Append-only: `actor_type`, `event_type`, optional `metadata_json` |

**Enums:** `ShareSessionStatus`, `ShareSessionType`, `ShareRecipientType`, `ShareAuditActorType`, `ShareAuditEventType` — see `apps/web/prisma/schema.prisma`.

**IDs:** `ShareSession` / related rows use `cuid()` string IDs aligned with existing relations (not `@db.Uuid` on these columns). `booking_id` and `guest_user_id` reference existing `Booking` / `User` UUID strings.

---

## Token flow

1. **Create (guest, authenticated):** `generateSecureToken()` → random **base64url** segment; persist **`hashToken(raw)`** only (`SHA-256` hex).
2. **Response:** raw token and `shareUrl` returned **once**; client may store in `sessionStorage` for “copy link” UX.
3. **Public read:** recipient opens `/share/[token]` → `GET /api/public-share/[token]` → `hashToken(token)` → lookup by `public_token_hash` → expiry checked → **safe payload** only.

---

## Service layer (`apps/web/lib/share-my-stay/`)

| File | Role |
|------|------|
| `token.ts` | `generateSecureToken()`, `hashToken()` (SHA-256) |
| `validators.ts` | Duration, share type, email, extend body parsing |
| `create-session.ts` | Booking ownership, revoke prior active sessions, create session + recipient + audit |
| `stop-session.ts` | Ownership, stop + clear last location + audit |
| `extend-session.ts` | Ownership, extend `expiresAt` (presets / minutes, checkout cap) + audit |
| `update-location.ts` | Ownership, `ACTIVE` + `LIVE_LOCATION` only, update latest point + audit |
| `get-public-share.ts` | Hash token, load session, **expire if past `expiresAt`**, optional `link_opened` audit, safe DTO |

Legacy helpers remain in `lib/share-sessions/` (duration, session lifecycle, recipient crypto). `lib/share-sessions/token.ts` re-exports from `share-my-stay/token` for backward compatibility.

---

## API routes

| Method | Route | Auth | Notes |
|--------|--------|------|--------|
| GET | `/api/share-sessions?bookingId=` | Guest | Latest session for booking; applies expiry |
| POST | `/api/share-sessions` | Guest | Creates session; ends prior `ACTIVE`/`PAUSED` for same booking; returns **token once** |
| POST | `/api/share-sessions/:id/stop` | Guest | Stops; clears last location |
| POST | `/api/share-sessions/:id/extend` | Guest | `preset` (`1h`, `8h`, `until_checkout`) or `addMinutes` 5–1440 |
| POST | `/api/share-sessions/:id/location` | Guest | Last-known point; live mode only |
| GET | `/api/public-share/:token` | None | Rate-limited per IP; **minimal** JSON; no raw internal IDs |

---

## Expiration logic

On **read/write** paths, `expireSessionIfNeeded()` in `lib/share-sessions/session-lifecycle.ts` transitions `expiresAt < now` to **`EXPIRED`** and denies active behaviour.

---

## Privacy rules (mandatory)

- **Off by default** — no session until guest creates one.
- **Explicit activation** — guest POSTs to create.
- **Visible when active** — guest UI shows banner / controls.
- **User can stop anytime** — stop API + UI.
- **Auto-expire** — time-based + lifecycle checks.
- **Minimal public data** — guest first name, listing title/city, stay status label, dates, optional last location; **no** payment, **no** account email, **no** booking/listing UUIDs on the public response.

---

## User flow

1. Guest opens **booking** or **Trips** → **Share My Stay**.
2. Modal: label, send method (copy link vs email), mode (status vs live), duration, privacy note → **Start sharing**.
3. Success: **Sharing started** → copy link, **View sharing status**, or **Done**.
4. Active: **banner** + **Sharing Active** card + optional **live location** row; **Copy secure link**, **Extend**, **Stop**.
5. Trusted contact opens **`/share/[token]`** (read-only cards; inactive if stopped/expired).
6. Session **expires** lazily on read/write; audit **`EXPIRED`** when past `expiresAt`.

---

## Web UI

**Guest (`components/bnhub/share-my-stay/`):** `ShareMyStayButton`, `ShareMyStayModal`, `ShareMyStaySuccessState`, `ActiveShareSessionCard`, `ShareMyStayBanner`, `StopShareSessionDialog`, `ExtendShareSessionModal`, `ShareLocationUpdateRow`, `ShareMyStaySection`, `ShareMyStayWorkspace`, `ShareMyStayRoot`.

**Public (`components/share/public-share/`):** `PublicShareStatusCard`, `PublicShareMapCard`, `PublicShareDetailsCard`, `PublicShareInactiveState` — composed on `app/share/[token]/page.tsx`.

- **Booking detail** (`/bnhub/booking/[id]`): `ShareMyStayRoot` + `ShareMyStayWorkspace` for confirmed/completed guest bookings (`booking-share-my-stay-bundle.tsx`).
- **Trips** (`/bnhub/trips`): `ShareMyStayButton` → booking anchor `#share-my-stay`.
- **Public** (`/share/[token]`): read-only page consuming `GET /api/public-share/[token]` (generic error copy if link is invalid — no token existence leak).

---

## Testing

- `lib/share-my-stay/validators.test.ts` (Vitest): extend body parsing, email, share type.
- Run: `pnpm exec vitest run lib/share-my-stay/validators.test.ts`

Manual / integration checks: wrong guest cannot create session for another booking (API 404); stop/expiry deny public payload; extend updates `expiresAt`.

---

## MVP complete vs deferred

| MVP complete | Deferred |
|--------------|----------|
| Secure link, hashed token, guest CRUD APIs | Redis-backed rate limits (in-memory MVP) |
| Lazy expiry + `EXPIRED` audit | Cron sweeper for idle rows |
| Guest modal, banner, card, stop/extend | Outbound email send to recipient |
| Public cards + inactive state | Full history / emergency dispatch |
| Last location point only | Background geolocation |

---

## Migrations

If your database is in sync with `schema.prisma`, run from `apps/web`:

```bash
pnpm prisma migrate dev --name share_my_stay
```

If migrate fails on a **shadow database** (e.g. missing unrelated tables in a remote clone), fix the DB or use `prisma db push` in a controlled dev environment — not specific to this feature.

---

## Out of scope (do not)

- Background / always-on location tracking.
- Full location history store.
- Exposing sensitive data on the public endpoint.
- Auto-enabling sharing without guest action.
