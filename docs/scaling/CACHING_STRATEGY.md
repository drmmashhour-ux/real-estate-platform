# Caching strategy

Caching reduces load and latency when **invalidation** and **tenant boundaries** are understood. Wrong cache keys are a **cross-tenant data leak** risk.

---

## Principles

- **Scope keys** by tenant and user (and any other isolation dimension your product uses).
- Prefer **short TTLs** when invalidation is hard; prefer **explicit invalidation** when correctness is critical.
- **Do not cache** permission-sensitive blobs without tying the key to the same auth context used to validate access.

---

## Safe candidates

### Unread notification counts (per user, per tenant)

| Field | Value |
|-------|--------|
| **Key pattern** | `notif:unread:{tenantId}:{userId}` |
| **Scope** | User + tenant |
| **Invalidation** | On read, archive, bulk read, or new notification for that user |
| **TTL** | Short (e.g. 30–120s) if invalidation is imperfect |

### Dashboard summary cards (aggregates)

| Field | Value |
|-------|--------|
| **Key pattern** | `dash:summary:{tenantId}:{userId}:{cardId}` |
| **Scope** | User + tenant |
| **Invalidation** | On underlying entity change affecting that card, or TTL expiry |
| **TTL** | 1–5 minutes for “soft” freshness |

### Tenant analytics overview (aggregated KPIs)

| Field | Value |
|-------|--------|
| **Key pattern** | `analytics:tenant:{tenantId}:{reportKey}:{period}` |
| **Scope** | Tenant |
| **Invalidation** | Job refresh after rollup; or TTL + nightly rebuild |
| **TTL** | Minutes to hours depending on product tolerance |

### Admin analytics overview (platform-wide)

| Field | Value |
|-------|--------|
| **Key pattern** | `analytics:admin:{reportKey}:{period}` |
| **Scope** | Global (admin-only); never mix with tenant keys |
| **Invalidation** | Scheduled job; manual bust after deploy |
| **TTL** | Longer (e.g. 5–15 min) if stale admin stats acceptable |

### Static marketing content

| Field | Value |
|-------|--------|
| **Key pattern** | CDN cache keys or `static:{path}:{buildId}` |
| **Scope** | Global |
| **Invalidation** | Deploy / purge CDN |
| **TTL** | Long |

### Branding / low-volatility settings

| Field | Value |
|-------|--------|
| **Key pattern** | `tenant:branding:{tenantId}` |
| **Scope** | Tenant |
| **Invalidation** | On settings update; TTL fallback |
| **TTL** | 5–30 minutes |

---

## Do **not** cache (without strict design)

- Raw lists of **other users’** records keyed only by global id.
- **Permission** outcomes unless the key includes user + tenant and invalidates on role change.
- Rapidly changing **workflow state** (offer status, contract stage) unless every transition busts the cache.

---

## Implementation notes

- **Redis** (or similar) is a common choice; **in-memory per instance** is acceptable only for best-effort non-critical data (e.g. rate limit counters with caveats).
- **HTTP caching** for public GETs with correct `Cache-Control` where safe.

See [TENANT_ISOLATION_AT_SCALE](./TENANT_ISOLATION_AT_SCALE.md) for cache key discipline under load.
