# Load Handling Strategy

**Goal:** Support 1,000 → 100,000+ users and high concurrent bookings.

---

## 1. Caching (Redis)

- **Search:** `GET /api/bnhub/search` — response cached by query params; TTL 60s when `REDIS_URL` is set.
- **Other candidates:** Project list, featured listings (already use Next.js `revalidate`), session data.
- **Usage:** `lib/cache/redis.ts` — `cacheGet`, `cacheSet`, `cacheDel`. No-op if Redis not configured.

---

## 2. Database

- **Indexes:** Ensure Prisma indexes on high-read models (User.email, Deal.buyerId/sellerId/brokerId, Booking.listingId/guestId, ShortTermListing.city/listingStatus).
- **Pagination:** All list APIs use `page` + `limit` (e.g. BNHub search max 100 per page).
- **Avoid N+1:** Use `include`/`select` in a single query where possible; avoid loops that query inside.

---

## 3. Rate Limiting

- **Auth:** `POST /api/auth/login` — 20 req/min per IP. `POST /api/auth/register` — 10 req/min per IP.
- **Payments:** `POST /api/stripe/checkout` — 20 req/min per user.
- **Implementation:** `lib/rate-limit.ts` (in-memory). For multi-instance production, use Redis-backed rate limit (same key shape, store in Redis with TTL).

---

## 4. Duplicate API Calls

- **Client:** Use React Query/SWR or similar to dedupe and cache GET requests by key.
- **Server:** Search cache (Redis) prevents duplicate backend work for identical queries within TTL.

---

## 5. Concurrency (Bookings)

- **Optimistic locking:** For high-contention slots, consider `listingId + checkIn + checkOut` unique constraint and handle conflict on insert.
- **Availability check:** `isListingAvailable` before `createBooking`; keep window between check and create minimal.
- **Idempotency:** Stripe webhook uses `stripeSessionId` to avoid duplicate payment records.

---

## 6. Scaling Checklist

| Item | Status |
|------|--------|
| Redis cache on search | ✅ Implemented |
| Pagination everywhere | ✅ List APIs |
| Rate limiting (auth, checkout) | ✅ Implemented |
| DB indexes | ⚠️ Review Prisma schema |
| Stateless API | ✅ Cookie/session; no in-memory state required for correctness |
| Horizontal scaling | ✅ App is stateless; add more instances behind load balancer |
| Redis for rate limit at scale | 📋 Use same `rate-limit` API with Redis store when multi-instance |

---

## 7. Monitoring

- Use `recordPlatformEvent` for key events (booking_created, payment_completed).
- Monitor 429 (rate limit), 5xx, and latency on auth/checkout/search.
- Set up alerts on error rate and P95 latency for critical paths.
