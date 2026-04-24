# Route security review checklist

**Purpose:** Manual verification that **critical API routes** (`apps/web/app/api/**`) enforce authentication, authorization, ownership, input validation, rate limiting, and safe error handling—before launch or after major changes.

**How to use**

1. Work **section by section** (below). For each route or route family, confirm the columns in the **verification matrix** and run the **test cases** (Preview/staging, test users).
2. Mark each row: **Pass** / **Fail** / **N/A** / **Follow-up ticket #…**
3. **CRITICAL** rows (payments, bookings, admin, documents, messaging, deal rooms) must pass before production launch.

**Legend**

| Column | Meaning |
|--------|---------|
| **Auth** | Session or API key required? (`getGuestId`, Bearer, cron secret) |
| **Authz** | Role or capability (admin, broker, host, deal participant) |
| **Ownership** | Resource scoped to `userId` / membership, not client-supplied identity alone |
| **Validation** | Params/body/query validated server-side (Zod, explicit checks) |
| **RL** | Rate limit or abuse gate (`checkRateLimit`, `checkRateLimitDistributed`, `gateDistributedRateLimit`) |
| **Risks** | Common abuse: IDOR, tampering, replay, injection |

**Standard test cases (apply per route where relevant)**

| # | Test | Expect |
|---|------|--------|
| T1 | **Guest access** | Unauthenticated caller gets `401`/`403` when route requires login (or intentional public behavior documented). |
| T2 | **Wrong user** | User A cannot read/write User B’s resource (`403` or empty scoped result). |
| T3 | **ID tampering** | Random UUID / another user’s id in path/body → `403`/`404`, not success. |
| T4 | **Invalid input** | Malformed body, bad email, non-UUID → `400` with generic message; no stack in response. |
| T5 | **Rate limit** | Burst over threshold → `429` with rate-limit headers where implemented. |

---

## 1. Auth routes

**Examples:** `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/demo-login`, `POST /api/auth/demo-session`, verify-email flows, staging demo login.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Login | Public | N/A | N/A | Email/password shape | Yes (IP + distributed) | Credential stuffing, user enum |
| Register | Public | N/A | N/A | Email, password policy | Yes | Mass signups, spam |
| Demo / staging login | Env-gated | N/A | N/A | — | Yes | Abuse on staging |

**Critical:** Register is **business-critical** (account creation).

**Verify**

- [ ] Production blocks test-only accounts where configured (`ALLOW_SEED_ADMIN_LOGIN`, etc.).
- [ ] Kill switch: `PLATFORM_DISABLE_PUBLIC_SIGNUP` returns `503` without leaking internals.
- [ ] Failed login returns **generic** message (no “user exists” vs “wrong password” split in prod if policy requires).

**Tests:** T1–T5 as applicable (T5 on login/register).

---

## 2. User / profile

**Examples:** `/api/user/*`, `/api/tenants/*`, `/api/finance/*` (user-scoped), profile update, session switch.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Profile read/update | Required | User | Self only | Fields bounded | Optional | IDOR on `userId` param |
| Tenant switch | Required | Role | Workspace membership | Tenant id UUID | Yes | Cross-tenant access |

**Verify**

- [ ] No route updates another user’s profile using only a client-supplied `userId` without server check.

**Tests:** T2, T3 for any `.../users/[id]` pattern.

---

## 3. Listings

**Examples:** `GET/PUT /api/bnhub/listings/[id]`, `GET /api/v1/listings`, FSBO ` /api/fsbo/listings/*`, host listing management, public search proxies.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Public listing read | Optional | Public read published | N/A | `id` format | Yes (some GETs) | Scraping, cache bypass |
| Host mutate listing | Required | Host/broker | Owner / authority | Payload + enums | Yes | IDOR, takeover |
| FSBO draft | Required | Seller | Owner | — | Yes | Spam listings |

**CRITICAL:** Host/seller **mutations** (publish, pricing, media).

**Verify**

- [ ] Mutations check `listing.ownerId` (or broker authority) vs session user.

**Tests:** T2, T3 on PATCH/PUT; T4 on invalid enums.

---

## 4. Bookings

**Examples:** `POST /api/v1/bookings`, BNHub booking checkout, `GET` booking status, guest payments, ` /api/bookings/*`, BNHub reservation flows.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Create booking | Required (guest/host rules) | Guest/host rules | Guest/host listing rules | Dates, amounts | Yes | Double-book, price manipulation |
| Booking quote | Mixed | — | Listing exists | Input | Yes | Abuse |

**CRITICAL:** Entire booking + payment path.

**Verify**

- [ ] Booking rows tied to correct `userId` / guest identity; host cannot confirm others’ bookings without rules.
- [ ] Amounts **recomputed server-side** from listing + dates where applicable (no trust client total).

**Tests:** T1–T5; **T3** with another user’s `bookingId`.

---

## 5. Payments

**Examples:** `POST /api/stripe/checkout`, `POST /api/stripe/confirm`, `POST /api/stripe/webhook`, Connect onboarding, `POST /api/billing/*`, BNHub marketplace payments, `POST /api/broker-billing/*`.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Checkout session | Required | User | Own cart/listing context | Line items server-side | Yes | Amount tampering |
| Webhook | Signature | Stripe only | N/A | `constructEvent` | High volume | Forgery, replay |
| Connect onboard | Required | Host | Own account | — | Yes | Account takeover |

**CRITICAL:** **All Stripe and billing webhooks** + checkout creation.

**Verify**

- [ ] `STRIPE_WEBHOOK_SECRET` verified before handling; **no** business logic on unsigned body.
- [ ] Idempotency for payment webhooks (duplicate events safe).

**Tests:** T1 (webhook **without** signature → `400`); T3 with wrong `metadata` user ids; T5 on checkout.

---

## 6. Messaging

**Examples:** Thread create/send, ` /api/messages/*`, BNHub host/guest messaging, CRM message bridges.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Send message | Required | Participant | Thread membership | Body length, attachments | Yes | Spam, phishing |
| List threads | Required | Participant | Own threads only | Pagination | Yes | IDOR across threads |

**CRITICAL:** Cross-user message access.

**Verify**

- [ ] `threadId` / `recipientId` resolves to membership **including session user**.

**Tests:** T2, T3 open another user’s thread id.

---

## 7. Deal rooms

**Examples:** `/api/deal-rooms`, `/api/deal-rooms/[id]/*`, stage, payments subroutes, communications under `/api/deals/[id]/*`.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Deal room CRUD | Required | Deal participant | Room membership | UUIDs, stage enums | Optional | IDOR, state tampering |
| Deal communications | Required | Participant | Same | Content bounds | Yes | Data leak |

**CRITICAL:** Financial + legal adjacent.

**Verify**

- [ ] Every `[id]` loads deal/deal-room membership for **current user** before mutate.

**Tests:** T2, T3 on `deal-rooms/[id]` and nested paths.

---

## 8. Documents

**Examples:** `POST /api/documents/upload`, legal drafting `/api/legal-drafting/drafts/*`, deal-room documents ` /api/deal-rooms/[id]/documents`, admin legal management.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Upload | Required | Role + deal | Deal/listing scope | MIME, size | Yes | Malware, oversized |
| Draft AI suggest | Required | Lawyer/broker/admin | Draft owner | Prompt bounds | Yes | Prompt injection |
| Export | Required | Same | Same | — | Yes | Unauthorized export |

**CRITICAL:** Uploads and **legal** exports.

**Verify**

- [ ] See [uploads.md](./uploads.md); signed URLs; no public listing of private keys.

**Tests:** T1 on upload; T4 invalid file type; T2 wrong deal id.

---

## 9. Broker CRM

**Examples:** `/api/lecipm/leads/*`, broker clients, visits, ` /api/broker/*`, hub capture, mortgage expert routes.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Lead detail/update | Required | Broker | Assigned/owned lead | IDs | Yes | CRM IDOR |
| Capture forms | Public/partner | Rate limited | Attribution | Email, honeypot | Yes | Spam leads |

**Verify**

- [ ] Broker A cannot `GET/PATCH /api/lecipm/leads/[id]` for Broker B’s lead.

**Tests:** T2, T3 on lead id; T5 on public capture.

---

## 10. Admin routes

**Examples:** `/api/admin/*`, cron with `CRON_SECRET`, internal ` /api/internal/*` with Bearer.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Admin JSON APIs | Session or Bearer | ADMIN (or ops roles) | N/A | Body | Yes / IP | Privilege escalation |
| Cron | Bearer `CRON_SECRET` | N/A | N/A | — | N/A | Unauthorized trigger |

**CRITICAL:** **All `/api/admin/*`** and destructive operations.

**Verify**

- [ ] Middleware + route handler both enforce admin (defense in depth).
- [ ] Cron routes reject missing/invalid `Authorization: Bearer`.

**Tests:** T1 as non-admin → `403`; T1 with wrong Bearer on cron → `401/403`.

---

## 11. Search

**Examples:** Buyer browse, BNHub search proxies, `/api/buyer/browse`, analytics, public listing APIs.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Public search | Optional/public | Read published | N/A | Query length, filters | Yes | Scraping, DoS |
| Saved searches | Required | User | Self | — | Yes | — |

**Verify**

- [ ] Heavy endpoints use RL + pagination caps.

**Tests:** T5 burst; T4 huge query string.

---

## 12. Uploads

**Examples:** `POST /api/documents/upload`, host photos, FSBO media, presigned URL flows.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Direct upload | Required | Owner/host | Listing/deal | MIME, size, ext | Yes | Malware, quota bypass |

**Verify**

- [ ] Storage path not guessable; ACL private by default.

**Tests:** T1; T4 wrong content-type; T4 oversized file.

---

## 13. Cross-cutting: webhooks & integrations

**Examples:** Stripe, `content-automation/webhooks/*`, social callbacks, `experiments/track`.

| Route / family | Auth | Authz | Ownership | Validation | RL | Risks |
|----------------|------|-------|------------|------------|-----|-------|
| Third-party webhook | Signature / secret | Provider | N/A | Raw body verify | Yes | Spoof |
| Experiments track | Session cookie | Assignment match | Server-side assignment | Zod body | Yes | Event spam |

**Verify**

- [ ] Each provider verifies **HMAC/signature** or shared secret before parsing JSON.

---

## 14. Sign-off

| Area | Reviewer | Date | Status |
|------|----------|------|--------|
| Auth | | | |
| Payments & webhooks | | | |
| Bookings | | | |
| Admin | | | |
| Messaging & deal rooms | | | |
| Documents & uploads | | | |
| Broker CRM | | | |

---

## Related documents

- [security-audit.md](./security-audit.md) — baseline risks  
- [testing.md](./testing.md) — automated/manual security tests  
- [release-security-checklist.md](./release-security-checklist.md) — release gates  
- [../dev/post-deploy-checklist.md](../dev/post-deploy-checklist.md) — post-deploy smoke  
