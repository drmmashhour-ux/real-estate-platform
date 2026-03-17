# LECIPM Platform — API Architecture Blueprint

**Complete backend API specification for the LECIPM ecosystem**

This document defines the API architecture for the LECIPM platform: domains, endpoint groups, main endpoints, request/response purposes, authentication and authorization rules, integration patterns, error handling, and versioning. It supports web, iOS, Android, admin, broker, owner, and host experiences and aligns with the [Platform Architecture](LECIPM-PLATFORM-ARCHITECTURE.md), [Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md), and [Product Requirements Document](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md). Backend and client engineers use this blueprint to build the system consistently.

---

## 1. API architecture overview

### Purpose of the API layer

The API layer is the **single programmatic interface** between all clients (web app, iOS, Android, admin tools, broker dashboard, owner dashboard, host tools) and the platform’s business logic and data. It provides:

- **Unified access** to identity, listings, bookings, payments, messaging, reviews, deals, analytics, Trust & Safety, and AI capabilities.
- **Consistent semantics** so the same operations (e.g. create booking, fetch payout) behave the same regardless of client.
- **Security boundary** where authentication and authorization are enforced before any domain logic runs.
- **Stability and evolution** through versioning, deprecation rules, and clear error contracts.

### How APIs support each client

| Client | Primary API usage |
|--------|-------------------|
| **Web platform** | Full API surface; server-rendered or SPA calling same REST APIs; optional BFF for aggregation. |
| **iOS app** | Same REST APIs; token in header; push registration and deep links map to resources (e.g. `/bookings/{id}`). |
| **Android app** | Same as iOS; consistent endpoints and payloads. |
| **Admin tools** | Admin-only domains: `/admin/*`, `/reports/*`; moderation, financial controls, audit logs. |
| **Broker dashboard** | User + CRM + listings + messaging; broker-scoped data. |
| **Owner dashboard** | User + owner-scoped properties, revenue, portfolio, maintenance, analytics. |
| **Host tools** | BNHub listings, calendar, bookings, payouts, messaging, reviews. |

All clients authenticate the same way (e.g. Bearer JWT or session cookie); authorization varies by role (guest, host, broker, investor, admin, support).

### API design philosophy

| Principle | Application |
|-----------|-------------|
| **Scalable** | Stateless APIs; horizontal scaling behind gateway; heavy reads (search, listings) can use caches or read replicas; write paths are clearly defined. |
| **Secure** | Token-based auth; role- and resource-based authorization; rate limiting; audit logging for sensitive actions; no sensitive data in URLs or logs. |
| **Modular** | APIs grouped by domain (auth, users, properties, bnhub, bookings, payments, messaging, etc.); services can own their domains and evolve independently. |
| **Versioned** | URL or header versioning (e.g. `/v1/...`); backward compatibility within major version; deprecation communicated and migration path defined. |
| **Role-aware** | Same endpoint may return different data or allow different actions based on role (e.g. host sees payout info, guest sees only their bookings). |

---

## 2. API style and standards

### REST structure

- **Base URL:** `https://api.lecipm.com/v1` (or per-environment).
- **Resources:** Nouns in plural where appropriate: `/users`, `/properties`, `/bookings`, `/payments`.
- **HTTP methods:** `GET` (read), `POST` (create, actions), `PATCH` (partial update), `PUT` (full replace where used), `DELETE` (delete or soft-delete).
- **IDs:** UUIDs in path: `/bookings/{bookingId}`, `/properties/{propertyId}`. No sequential IDs in URLs.

### JSON request and response format

- **Request:** `Content-Type: application/json`. Body for POST/PATCH/PUT only.
- **Response:** `Content-Type: application/json`. UTF-8.
- **Success body:** Single resource `{ "id": "...", "name": "..." }` or list wrapper:
  ```json
  {
    "data": [ { "id": "...", ... } ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalCount": 100,
      "hasMore": true
    }
  }
  ```
- **Field naming:** camelCase in JSON (e.g. `createdAt`, `checkIn`). Internal DB may use snake_case; API contract is camelCase.

### Naming conventions

- **Paths:** kebab-case optional for multi-word segments: `/booking-status-history` or `/bookingStatusHistory`; project standard: **camelCase** for resource names in paths for consistency with JSON, e.g. `/bookings/{bookingId}/priceBreakdown`.
- **Query params:** camelCase: `checkIn`, `checkOut`, `minPrice`, `maxGuests`.
- **Headers:** `Authorization: Bearer <token>`, `X-Request-Id`, `X-Idempotency-Key`, `Accept-Language`, `X-API-Version`.

### Pagination

- **Parameters:** `page` (1-based) and `pageSize` (default 20, max 100).
- **Response:** Include `pagination` object with `page`, `pageSize`, `totalCount`, `hasMore` (and optionally `nextCursor` for cursor-based where used).
- **Cursor alternative:** For very large or real-time lists, support `cursor` and `limit`; response returns `nextCursor`.

### Filtering

- **Query params:** Filter by resource attributes: `?city=Montreal&country=CA&minPrice=10000&maxPrice=50000` (price in cents). Use plural for multi-value: `?amenities=wifi,parking`.
- **Documentation:** List all supported filters per endpoint; invalid or unknown filters are ignored or return 400 with clear message.

### Sorting

- **Parameter:** `sort` with value like `createdAt` or `-createdAt` (minus for descending). Allow only documented fields.
- **Default:** Per-endpoint (e.g. listings: `-createdAt`; bookings: `-checkIn`).

### Versioning format

- **URL versioning:** `/v1/...`, `/v2/...`. Default version when omitted can be v1 (or header `X-API-Version: 1`).
- **Version in response:** Optional `X-API-Version` or in meta; not required if URL carries version.

### Idempotency

- **Where required:** Payment confirm, refund, booking create (when payment is captured), payout trigger.
- **Header:** `X-Idempotency-Key: <uuid or client-generated key>`.
- **Behavior:** Same key within TTL (e.g. 24h) returns same result without re-executing; 409 if key reused with different body.

---

## 3. Authentication APIs

**Base path:** `/v1/auth`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/auth/register` | Create new account | Public |
| POST | `/auth/login` | Sign in; returns access + refresh token | Public |
| POST | `/auth/logout` | Invalidate refresh token / session | Authenticated |
| POST | `/auth/refresh` | Issue new access token from refresh token | Public (with valid refresh) |
| POST | `/auth/forgot-password` | Send password reset email/link | Public |
| POST | `/auth/reset-password` | Set new password from reset token | Public |
| POST | `/auth/verify-email` | Confirm email (token in body or query) | Public |
| POST | `/auth/verify-phone` | Request or confirm phone OTP | Public or Authenticated |

### POST /auth/register

- **Purpose:** Create a new user account (guest/host/broker/investor).
- **Request body:** `email`, `password`, `name`, optional `phone`, optional `locale`, optional `role` (default guest).
- **Response:** `user` (id, email, name, roles, verificationStatus), `accessToken`, `refreshToken`, `expiresIn`.
- **Access:** Public. Rate-limited by IP/email.

### POST /auth/login

- **Purpose:** Authenticate and receive tokens.
- **Request body:** `email`, `password`; optional `deviceId` for push/session binding.
- **Response:** `user` (minimal), `accessToken`, `refreshToken`, `expiresIn`.
- **Access:** Public. Rate-limited; lockout after N failures.

### POST /auth/logout

- **Purpose:** Invalidate refresh token (and optionally all sessions for user).
- **Request body:** Optional `refreshToken`; if omitted, invalidate token from header or all sessions for user.
- **Response:** 204 No Content.
- **Access:** Authenticated.

### POST /auth/refresh

- **Purpose:** Get new access token without re-entering password.
- **Request body:** `refreshToken`.
- **Response:** `accessToken`, `refreshToken` (optional rotation), `expiresIn`.
- **Access:** Public with valid refresh token.

### POST /auth/forgot-password

- **Purpose:** Send reset link/email to registered email.
- **Request body:** `email`.
- **Response:** 202 Accepted with generic message (do not reveal if email exists).
- **Access:** Public. Rate-limited.

### POST /auth/reset-password

- **Purpose:** Set new password using token from email/link.
- **Request body:** `token`, `newPassword`.
- **Response:** 200 and optional login response, or 400 if token invalid/expired.
- **Access:** Public.

### POST /auth/verify-email

- **Purpose:** Mark email verified via link or code.
- **Request body or query:** `token` or `code`.
- **Response:** 200; optional updated `user` with verificationStatus.
- **Access:** Public.

### POST /auth/verify-phone

- **Purpose:** Request OTP or verify phone with OTP.
- **Request body:** `phone` (E.164), optional `code` (for verify step).
- **Response:** If request: 200 { "sent": true }. If verify: 200 and optional user update.
- **Access:** Public (request) or Authenticated (verify for own account).

---

## 4. User account APIs

**Base path:** `/v1/users`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/users/me` | Current user profile | Authenticated |
| PATCH | `/users/me` | Update profile | Authenticated |
| GET | `/users/{id}` | Public profile (limited fields) | Authenticated (or public for minimal) |
| GET | `/users/me/roles` | Current user roles | Authenticated |
| GET | `/users/me/settings` | Account settings & preferences | Authenticated |
| PATCH | `/users/me/settings` | Update settings | Authenticated |
| GET | `/users/me/sessions` | List active sessions | Authenticated |
| DELETE | `/users/me/sessions/{sessionId}` | Revoke one session | Authenticated |

### GET /users/me

- **Purpose:** Full profile for current user (name, email, phone, locale, timezone, verificationStatus, roles, optional host/broker profile).
- **Response:** Single user object with allowed fields.
- **Access:** Authenticated.

### PATCH /users/me

- **Purpose:** Update name, phone, locale, timezone; not email (use separate flow) or password (use reset).
- **Request body:** Partial object: `name`, `phone`, `locale`, `timezone`.
- **Response:** Updated user object.
- **Access:** Authenticated.

### GET /users/{id}

- **Purpose:** Public or semi-public profile (e.g. for host in listing, counterparty in message). Only non-sensitive fields.
- **Response:** id, name, avatar, verificationStatus, memberSince; no email/phone unless permitted by privacy.
- **Access:** Authenticated; or public for minimal (e.g. host name on listing).

### GET /users/me/roles

- **Purpose:** List roles (guest, host, broker, investor) and optionally status (e.g. broker verified).
- **Response:** `roles: [{ role, verifiedAt?, ... }]`.
- **Access:** Authenticated.

### GET /users/me/settings & PATCH /users/me/settings

- **Purpose:** Account and notification preferences (language, currency, email/push/SMS toggles per category).
- **Request body (PATCH):** `locale`, `currency`, `notifications` (object with channel/category and boolean).
- **Response:** Current settings object.
- **Access:** Authenticated.

### GET /users/me/sessions & DELETE /users/me/sessions/{sessionId}

- **Purpose:** List devices/sessions and revoke one or all.
- **Response (list):** sessionId, deviceInfo, lastActiveAt, current (boolean).
- **Access:** Authenticated; user can only revoke own sessions.

---

## 5. Identity verification APIs

**Base path:** `/v1/verifications`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/verifications/identity` | Start or submit identity verification | Authenticated |
| GET | `/verifications/identity/status` | Current identity verification status | Authenticated |
| POST | `/verifications/address` | Submit address document | Authenticated |
| POST | `/verifications/business` | Submit business verification (broker) | Broker |
| GET | `/verifications/history` | List verification attempts and outcomes | Authenticated |

### POST /verifications/identity

- **Purpose:** Create applicant with provider (e.g. Stripe Identity, Jumio), or upload documents for manual review. Used for guest and host verification.
- **Request body:** Optional `returnUrl`, optional document upload refs; provider may use redirect or SDK.
- **Response:** `verificationId`, `status`, `applicantId` or `url` for redirect.
- **Access:** Authenticated. Host/guest/broker as per policy.

### GET /verifications/identity/status

- **Purpose:** Poll verification status (pending, verified, failed, requires_input).
- **Response:** `status`, `lastCheckedAt`, optional `rejectionReason`.
- **Access:** Authenticated (own status only).

### POST /verifications/address & POST /verifications/business

- **Purpose:** Submit proof of address or business license for broker verification.
- **Request body:** References to uploaded documents (e.g. `documentId` from `/media` or `/documents`).
- **Response:** 202 Accepted and verification task id; status via history.
- **Access:** Authenticated; business limited to users with broker role.

### GET /verifications/history

- **Purpose:** List past verification attempts (identity, address, business) and outcomes.
- **Response:** List of { type, status, createdAt, completedAt, rejectionReason? }.
- **Access:** Authenticated (own history only).

---

## 6. Real estate listing APIs

**Base path:** `/v1/properties`

Covers marketplace listings (sale, long-term rental). BNHub short-term listings are under §8.

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/properties` | Create listing | Authenticated (owner/broker) |
| GET | `/properties` | List/filter listings | Public (live) or Owner/Broker (own) |
| GET | `/properties/{propertyId}` | Get single listing | Public or Authenticated |
| PATCH | `/properties/{propertyId}` | Update listing | Owner/Broker (own) |
| DELETE | `/properties/{propertyId}` | Soft-delete listing | Owner/Broker (own) |
| POST | `/properties/{propertyId}/images` | Add images | Owner/Broker (own) |
| DELETE | `/properties/{propertyId}/images/{imageId}` | Remove image | Owner/Broker (own) |
| POST | `/properties/{propertyId}/amenities` | Set amenities | Owner/Broker (own) |
| POST | `/properties/{propertyId}/rules` | Set rules (e.g. pets, smoking) | Owner/Broker (own) |
| GET | `/properties/{propertyId}/analytics` | View counts, leads (if any) | Owner/Broker (own) |

### Request/response (create/update)

- **Create:** `title`, `description`, `propertyType`, `address`, `city`, `region`, `country`, `latitude`, `longitude`, `priceCents`, `currency`, `bedrooms`, `baths`, `listingType` (sale | long_term_rent), optional `brokerId`, optional `registrationNumber`.
- **Response:** Full property object with `id`, `status` (draft | pending_review | live | suspended | archived), `createdAt`, `updatedAt`.
- **Filtering (GET /properties):** `city`, `country`, `region`, `propertyType`, `minPrice`, `maxPrice`, `bedrooms`, `listingType`, `status` (for owner), `page`, `pageSize`, `sort`.

---

## 7. Search and discovery APIs

**Base path:** `/v1/search`

Search is the primary discovery path; results can be properties (marketplace), BNHub listings, or deals. Backed by search index; DB used for detail and consistency.

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/search/properties` | Search marketplace listings | Public |
| GET | `/search/bnhub` | Search short-term listings | Public |
| GET | `/search/deals` | Search deals | Public or Authenticated |
| GET | `/search/suggestions` | Autocomplete (location, type) | Public |
| GET | `/search/filters` | Available filter options (aggregations) | Public |
| GET | `/search/map` | Geo/map search (bounds or center+radius) | Public |

### GET /search/properties & GET /search/bnhub

- **Purpose:** Full-text and faceted search with filters. Properties: city, country, type, price, bedrooms. BNHub: same plus checkIn, checkOut, guests, amenities.
- **Query params:** `q`, `city`, `country`, `minPrice`, `maxPrice`, `bedrooms`, `guests` (bnhub), `checkIn`/`checkOut` (bnhub), `amenities`, `sort`, `page`, `pageSize`, `bounds` (for map).
- **Response:** `data` (list of summary objects with id, title, price, location, image), `pagination`, optional `aggregations` (counts per filter).

### GET /search/deals

- **Purpose:** Find deals by location, type, keyword.
- **Query params:** `q`, `location`, `type`, `sort`, `page`, `pageSize`.
- **Response:** List of deal summaries; access to full deal via `/deals/{dealId}`.

### GET /search/suggestions

- **Purpose:** Autocomplete for location or property type.
- **Query params:** `q`, `type` (location | propertyType), `limit`.
- **Response:** List of suggestion strings or { value, count }.

### GET /search/filters

- **Purpose:** Return available filter values and counts for current context (e.g. cities in country, price range min/max).
- **Query params:** Same as search minus pagination; response: aggregations only.

### GET /search/map

- **Purpose:** Listings or BNHub within map bounds (or center + radius). Used for map UI.
- **Query params:** `bounds` (bbox) or `lat`, `lng`, `radiusKm`; `type` (properties | bnhub); filters as in search.
- **Response:** Geo JSON or list of { id, lat, lng, summary } for markers.

---

## 8. BNHub listing APIs

**Base path:** `/v1/bnhub/listings`

Short-term rental listings; extends concept of property with nightly price, availability, house rules.

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/bnhub/listings` | Create BNHub listing | Host |
| GET | `/bnhub/listings` | List (host: own; public: live) | Host / Public |
| GET | `/bnhub/listings/{listingId}` | Get listing detail | Public or Host (own) |
| PATCH | `/bnhub/listings/{listingId}` | Update listing | Host (own) |
| DELETE | `/bnhub/listings/{listingId}` | Remove listing | Host (own) |
| POST | `/bnhub/listings/{listingId}/photos` | Add photos | Host (own) |
| POST | `/bnhub/listings/{listingId}/pricing` | Set nightly/cleaning/fees | Host (own) |
| POST | `/bnhub/listings/{listingId}/availability` | Bulk update availability | Host (own) |
| GET | `/bnhub/listings/{listingId}/calendar` | Get calendar (availability + blocks) | Host (own) or Public (read-only) |

### Create/update fields

- **Listing:** title, description, address, city, region, country, lat/lng, propertyType, nightlyPriceCents, cleaningFeeCents, currency, maxGuests, bedrooms, beds, baths, checkInTime, checkOutTime, houseRules, minNights, maxNights, registrationNumber, status.
- **Pricing:** nightlyPriceCents, cleaningFeeCents, optional seasonal overrides.
- **Availability:** Array of { date, available | blocked }; or range with default.

### GET /bnhub/listings/{listingId}/calendar

- **Response:** For range (e.g. month): dates with status (available, blocked, booked), minNights, price. Used by host to manage and by guest to see availability.

---

## 9. Booking APIs

**Base path:** `/v1/bookings`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/bookings` | Create reservation | Guest |
| GET | `/bookings` | List my bookings or (host) my listings’ bookings | Guest / Host |
| GET | `/bookings/{bookingId}` | Get booking detail | Guest or Host (involved) |
| PATCH | `/bookings/{bookingId}` | Update (e.g. guest count, notes) pre-confirm | Guest/Host as allowed |
| POST | `/bookings/{bookingId}/cancel` | Cancel booking | Guest or Host (policy applies) |
| POST | `/bookings/{bookingId}/approve` | Host approve request | Host (own listing) |
| POST | `/bookings/{bookingId}/decline` | Host decline request | Host (own listing) |
| GET | `/bookings/{bookingId}/priceBreakdown` | Get price breakdown | Guest or Host |
| GET | `/bookings/{bookingId}/statusHistory` | Audit status changes | Guest or Host |

### POST /bookings

- **Purpose:** Create reservation. For instant book: confirm and charge. For request: create as reserved, then host approves/declines and payment captures on approval.
- **Request body:** `listingId`, `checkIn`, `checkOut`, `guests`, optional `message`, optional `idempotencyKey`. Payment method or payment intent ref if required.
- **Response:** Booking object with status (reserved | confirmed | cancelled | completed), totalCents, currency, hostPayoutCents, etc.
- **Flow:** Validate availability → calculate total → create booking (and optionally create payment intent or capture). Idempotency for create.

### Cancel / approve / decline

- **Cancel:** Request body optional `reason`; policy (free cancel window, fee) applied; refund via payment API if applicable.
- **Approve:** Host approves; payment captured if not already; status → confirmed; notifications sent.
- **Decline:** Host declines; status → cancelled; optional message to guest.

### GET /bookings/{bookingId}/priceBreakdown

- **Response:** nightlyTotalCents, cleaningFeeCents, platformGuestFeeCents, platformHostFeeCents, taxCents, totalCents, currency.

---

## 10. Calendar and availability APIs

**Base path:** `/v1/calendar`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/calendar/{listingId}` | Get calendar for range | Host (own) or Public |
| PATCH | `/calendar/{listingId}` | Bulk update dates (available/blocked) | Host (own) |
| POST | `/calendar/{listingId}/block` | Block date range | Host (own) |
| DELETE | `/calendar/{listingId}/block/{blockId}` | Remove block | Host (own) |
| GET | `/calendar/{listingId}/availability` | Get availability (for booking widget) | Public |

### GET /calendar/{listingId}

- **Query:** `start`, `end` (dates).
- **Response:** List of dates with status (available, blocked, booked), and optional minNights/maxNights/price per date if applicable.

### POST /calendar/{listingId}/block

- **Request body:** `start`, `end`, optional `reason`.
- **Response:** blockId and updated calendar slice.

### GET /calendar/{listingId}/availability

- **Purpose:** Lightweight check for date range (e.g. “is this range available?”). Used by search and booking flow.
- **Query:** `checkIn`, `checkOut`, optional `guests`.
- **Response:** available (boolean), optional message if not (e.g. “min 3 nights”).

---

## 11. Payment APIs

**Base path:** `/v1/payments`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/payments/intent` | Create payment intent (booking) | Guest |
| POST | `/payments/confirm` | Confirm payment (after 3DS etc.) | Guest |
| GET | `/payments/{paymentId}` | Get payment detail | Payer or payee (host) |
| GET | `/payments/history` | List my payments | Authenticated |
| POST | `/payments/refund` | Request refund | Guest/Host/Admin as policy |
| GET | `/payments/refunds/{refundId}` | Get refund status | Authenticated |
| GET | `/payments/methods` | List saved payment methods | Authenticated |
| POST | `/payments/methods` | Add payment method | Authenticated |
| DELETE | `/payments/methods/{methodId}` | Remove payment method | Authenticated |

### POST /payments/intent

- **Purpose:** Create server-side payment intent (Stripe or similar) for a booking or other charge. Client uses intent client_secret for frontend confirm.
- **Request body:** `bookingId` (or other reference), `amountCents`, `currency`, optional `idempotencyKey`.
- **Response:** `paymentIntentId`, `clientSecret`, `status`.

### POST /payments/confirm

- **Purpose:** Confirm that client has completed payment (e.g. 3DS); server may finalize capture and update booking/payment status.
- **Request body:** `paymentIntentId` or `paymentId`, optional idempotency.
- **Response:** Payment and booking status.

### GET /payments/history

- **Query:** `role` (guest | host), `status`, `from`, `to`, page, pageSize.
- **Response:** List of payments with booking ref, amount, status, createdAt.

### POST /payments/refund

- **Request body:** `paymentId`, `amountCents` (full or partial), `reason`, `idempotencyKey`.
- **Response:** Refund object (id, status, amountCents). Authorization: guest for own payment; host/admin per policy.

### Payment methods

- **GET:** List non-sensitive (last4, brand, isDefault).
- **POST:** Add method (e.g. payment method id from Stripe Elements); server stores and links to user.
- **DELETE:** Remove method; cannot remove if it’s the only default.

---

## 12. Host payout APIs

**Base path:** `/v1/payouts`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/payouts` | List payouts | Host |
| GET | `/payouts/{payoutId}` | Payout detail | Host (own) |
| POST | `/payouts/accounts` | Register payout account (Stripe Connect etc.) | Host |
| GET | `/payouts/accounts` | Get connected account(s) | Host |
| PATCH | `/payouts/accounts/{accountId}` | Update account (e.g. default currency) | Host |
| GET | `/payouts/reports` | Payout reports / statements | Host |

### Payout account

- **POST:** Start onboarding (redirect or link) or attach external account; returns account id and status (pending_verification, active).
- **GET/PATCH:** View and update default currency, etc.

### GET /payouts & GET /payouts/{payoutId}

- **Response:** List/detail with amountCents, currency, status (pending | paid | failed | on_hold), scheduledAt, paidAt, related booking ids. Held payouts include holdReason.

### GET /payouts/reports

- **Query:** `from`, `to`, format (json | csv).
- **Response:** Summary (total paid, count, by currency) and line items or file download.

---

## 13. Messaging APIs

**Base path:** `/v1/conversations`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/conversations` | List my conversations | Authenticated |
| POST | `/conversations` | Start conversation (e.g. with booking) | Authenticated |
| GET | `/conversations/{conversationId}` | Get conversation + participants | Participant |
| POST | `/conversations/{conversationId}/messages` | Send message | Participant |
| GET | `/conversations/{conversationId}/messages` | List messages (paginated) | Participant |
| POST | `/conversations/{conversationId}/attachments` | Upload attachment to message | Participant |

### GET /conversations

- **Query:** `type` (booking | deal | support), `unreadOnly`, page, pageSize.
- **Response:** List with lastMessagePreview, unreadCount, otherParticipant(s), bookingId/dealId if applicable.

### POST /conversations

- **Request body:** `type`, `bookingId` or `dealId` (for booking/deal threads); optional `initialMessage`.
- **Response:** conversation object; if thread already exists for that booking/deal, return existing.

### Messages

- **POST:** `body` (text), optional attachment refs. Response: message object with id, body, senderId, createdAt, readAt.
- **GET:** Query `before` (cursor or date), `limit`. Returns messages in chronological order. Support marking as read (e.g. PATCH conversation or message readAt).

### Unread counts

- **Option A:** In each conversation in list. **Option B:** GET `/conversations/unreadCount` returning total or by type. Used for badges.

---

## 14. Review and rating APIs

**Base path:** `/v1/reviews` and `/v1/ratings`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/reviews` | Submit review (guest→listing/host, host→guest) | Guest/Host (post stay) |
| GET | `/reviews` | List reviews (by listing or by user) | Public / Authenticated |
| GET | `/reviews/{reviewId}` | Get single review | Public |
| PATCH | `/reviews/{reviewId}` | Edit review (within policy window) | Author (own) |
| POST | `/reviews/{reviewId}/report` | Report review | Authenticated |
| GET | `/ratings/{userId}` | Aggregate ratings for user (host/guest) | Public |
| GET | `/ratings/{listingId}` | Aggregate ratings for listing | Public |

### POST /reviews

- **Request body:** `bookingId`, `role` (guest_review | host_review), `rating` (1–5), `comment`.
- **Response:** Review object. One review per role per booking; only after stay completed.

### GET /reviews

- **Query:** `listingId` or `userId`, `role`, page, pageSize, sort.
- **Response:** List of reviews; optionally aggregate in response or via `/ratings/{listingId}`.

### GET /ratings/{listingId} & GET /ratings/{userId}

- **Response:** averageRating, reviewCount, optional breakdown (e.g. by category if supported).

---

## 15. Broker CRM APIs

**Base path:** `/v1/crm`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/crm/leads` | List leads | Broker |
| POST | `/crm/leads` | Create lead | Broker |
| PATCH | `/crm/leads/{leadId}` | Update lead | Broker (own) |
| GET | `/crm/clients` | List clients (contacts) | Broker |
| POST | `/crm/clients` | Create client | Broker |
| PATCH | `/crm/clients/{clientId}` | Update client | Broker (own) |
| GET | `/crm/listings` | List broker’s listings | Broker |
| GET | `/crm/tasks` | List tasks | Broker |
| POST | `/crm/tasks` | Create task | Broker |
| GET | `/crm/notes` | List notes (e.g. per lead/client) | Broker |
| POST | `/crm/notes` | Add note | Broker |

### Leads

- **Fields:** name, email, phone, source, status (new | contacted | qualified | lost | won), listingId, contactId, message, createdAt.
- **Filter:** status, listingId, date range.

### Clients (contacts)

- **Fields:** name, email, phone, source, notes. Linked to leads and listings where applicable.

### Tasks & notes

- **Tasks:** title, dueDate, relatedTo (leadId/clientId/listingId), status, assigneeId (self).
- **Notes:** content, relatedTo (leadId/clientId), createdAt. Used for internal CRM only.

---

## 16. Owner dashboard APIs

**Base path:** `/v1/owner`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/owner/properties` | List my properties (marketplace + BNHub) | Owner |
| GET | `/owner/properties/{propertyId}` | Property detail with performance | Owner (own) |
| GET | `/owner/revenue` | Revenue summary and time series | Owner |
| GET | `/owner/portfolio` | Portfolio snapshot | Owner |
| GET | `/owner/maintenance` | List maintenance requests | Owner |
| POST | `/owner/maintenance` | Create maintenance request | Owner |
| GET | `/owner/analytics` | Property/listings analytics | Owner |

### GET /owner/properties

- **Response:** Unified list of marketplace and BNHub listings with key metrics (views, bookings, revenue) if available.

### GET /owner/revenue

- **Query:** `from`, `to`, `groupBy` (day | month), currency.
- **Response:** totalRevenueCents, by listing or by period.

### GET /owner/portfolio

- **Response:** Snapshot: totalListings, totalRevenue (period), occupancyRate, topPerformers.

### Maintenance

- **Fields:** listingId, type (cleaning | repair), description, status, scheduledAt. Owner creates; can assign to internal or partner.

### GET /owner/analytics

- **Query:** listingId or all, from, to.
- **Response:** Views, bookings, revenue, occupancy, optional comparison to market (from analytics service).

---

## 17. Deal marketplace APIs

**Base path:** `/v1/deals`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/deals` | Create deal | Broker/Investor |
| GET | `/deals` | List deals (public or my) | Public / Authenticated |
| GET | `/deals/{dealId}` | Deal detail | Public or by visibility |
| PATCH | `/deals/{dealId}` | Update deal | Owner (own) |
| GET | `/deals/{dealId}/participants` | List participants / interests | Owner or Admin |
| POST | `/deals/{dealId}/messages` | Send message in deal thread | Participant |
| GET | `/deals/{dealId}/documents` | List documents | Participant |
| POST | `/deals/{dealId}/documents` | Upload document | Owner |

### POST /deals & PATCH /deals/{dealId}

- **Fields:** title, description, type (off_market | partnership | development), location, priceOrTerms, visibility (public | invite_only), status (draft | published | closed).
- **Response:** Full deal object.

### Participants

- **GET:** List users who expressed interest (deal_interests) or were invited; only deal owner or admin.

### Messages & documents

- **Messages:** Same pattern as conversations; deal thread may be 1:1 with conversation or separate. POST body: message text; optional attachment.
- **Documents:** Upload ref (via /media or /documents); metadata (name, type). Access: participants only.

---

## 18. Investment analytics APIs

**Base path:** `/v1/analytics`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/analytics/market` | Market-level data (region) | Authenticated |
| GET | `/analytics/properties/{propertyId}` | Property-level analytics | Owner (own) |
| GET | `/analytics/portfolio` | User portfolio metrics | Owner/Investor |
| GET | `/analytics/deals/{dealId}` | Deal-level analytics | Deal owner/participant |
| GET | `/analytics/valuation/{propertyId}` | Valuation estimate | Owner (own) |
| GET | `/analytics/forecasts` | Demand/price forecasts | Authenticated |

### GET /analytics/market

- **Query:** regionKey, periodStart, periodEnd, metrics (occupancy, avgPrice, volume).
- **Response:** Time series or summary for region.

### GET /analytics/properties/{propertyId}

- **Query:** from, to. **Response:** Revenue, occupancy, comparisons; same as used in owner dashboard.

### GET /analytics/portfolio

- **Response:** Aggregated metrics for current user’s listings/portfolio.

### GET /analytics/valuation/{propertyId}

- **Response:** estimatedValueCents, valuationType, modelVersion, computedAt. From AI/analytics service.

### GET /analytics/forecasts

- **Query:** regionKey or listingId, horizon (30d | 90d). **Response:** Demand index or price forecast series.

---

## 19. Trust & Safety APIs

**Base path:** `/v1/incidents`, `/v1/flags`, `/v1/suspensions`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/incidents` | Report incident | Authenticated |
| GET | `/incidents` | List my reports or (admin) all | Reporter / Admin |
| GET | `/incidents/{incidentId}` | Incident detail | Reporter or Admin |
| PATCH | `/incidents/{incidentId}` | Update (e.g. add info) | Reporter or Admin |
| POST | `/incidents/{incidentId}/evidence` | Attach evidence | Reporter or Admin |
| GET | `/flags` | List account flags (admin) | Admin |
| POST | `/flags` | Flag account | Admin/Support |
| GET | `/suspensions` | List suspensions (admin) | Admin |
| POST | `/suspensions` | Suspend user | Admin |

### POST /incidents

- **Request body:** reportedUserId, reportedListingId, bookingId (optional), type (safety | fraud | policy | payment | other), description, priority (optional).
- **Response:** incidentId, status (open | in_progress | resolved). Reporter sees own; admin sees all and can PATCH status, assignee, resolutionNotes.

### Evidence

- **POST:** Upload document/photo ref; stored with incident for investigation.

### Flags & suspensions

- **Flags:** Internal marker on user (e.g. “high risk”, “manual review”). POST: userId, flagType, reason. GET: list for admin.
- **Suspensions:** POST creates or updates user suspension (sets users.suspended_at); GET lists active suspensions. Admin only.

---

## 20. Dispute resolution APIs

**Base path:** `/v1/disputes`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/disputes` | Open dispute | Claimant (guest/host) |
| GET | `/disputes` | List my disputes or (admin) all | Claimant / Admin |
| GET | `/disputes/{disputeId}` | Dispute detail | Participant or Admin |
| PATCH | `/disputes/{disputeId}` | Update (e.g. add info) | Claimant or Admin |
| POST | `/disputes/{disputeId}/documents` | Attach document | Participant |
| POST | `/disputes/{disputeId}/messages` | Add message to thread | Participant |
| GET | `/disputes/{disputeId}/resolution` | Get resolution outcome | Participant |

### POST /disputes

- **Request body:** bookingId or paymentId, type (refund | conduct | damage), description.
- **Response:** disputeId, status (open | in_progress | resolved). Claimant must be guest or host on that booking/payment.

### Resolution

- **GET /disputes/{disputeId}/resolution:** resolution (refund_full | refund_partial | no_refund), resolutionAmountCents, resolvedAt, resolverId. Only after resolved.

### Documents & messages

- Same pattern as incidents; used for evidence and communication between parties and support.

---

## 21. AI Control Center APIs

**Base path:** `/v1/ai`

Read-oriented APIs for AI-derived data; write actions (e.g. apply pricing recommendation) are done via listing/booking/payment APIs. Admin-only endpoints for queue and triage.

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/ai/riskScores/{userId}` | User risk score | Admin or self (limited) |
| GET | `/ai/riskScores/listings/{listingId}` | Listing risk/quality score | Admin or owner (own) |
| GET | `/ai/fraudAlerts` | List active fraud alerts | Admin |
| GET | `/ai/pricingRecommendations/{listingId}` | Pricing suggestion | Host (own listing) |
| GET | `/ai/demandForecasts/{marketId}` | Demand forecast | Authenticated |
| GET | `/ai/moderationQueue` | Content for moderation | Admin/Moderator |
| POST | `/ai/supportTriage` | Submit for triage (e.g. ticket) | Support or system |

### Risk scores

- **Response:** score (0–100), components (optional), updatedAt. Used for Trust & Safety and host dashboard (own listing).

### Fraud alerts

- **Response:** List of alerts (user, booking, or listing ref, score, reason codes). Admin only.

### Pricing recommendations

- **Response:** recommendedNightlyCents, rangeLowCents, rangeHighCents, modelVersion, computedAt. Host uses to update listing.

### Moderation queue

- **Response:** List of items (listing, review, message) pending review with reasonCode. PATCH or separate action to approve/remove.

### POST /ai/supportTriage

- **Request body:** conversationId or ticket ref, priority. **Purpose:** Route to human or automation; returns suggested category or assignment.

---

## 22. Notifications APIs

**Base path:** `/v1/notifications`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/notifications` | List my notifications | Authenticated |
| PATCH | `/notifications/{notificationId}/read` | Mark read | Authenticated |
| GET | `/notifications/preferences` | Get preferences | Authenticated |
| PATCH | `/notifications/preferences` | Update preferences | Authenticated |
| POST | `/notifications/test` | Send test (e.g. push) | Authenticated |

### GET /notifications

- **Query:** channel (in_app | email | push), unreadOnly, type (booking_confirmed | new_message | payout_sent | ...), page, pageSize.
- **Response:** List of notifications with type, payload (title, body, deepLink), readAt, createdAt. PATCH read marks one or bulk.

### Preferences

- **GET/PATCH:** Per channel and category: { email: { booking: true, marketing: false }, push: { ... } }. Used by notification service when sending.

### POST /notifications/test

- **Request body:** channel (email | push). Sends test notification to current user; used for verifying device/settings.

---

## 23. Admin APIs

**Base path:** `/v1/admin`

All endpoints require admin (or support) role. Sensitive actions must be audited.

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/admin/users` | List/search users | Admin |
| GET | `/admin/properties` | List all listings (any status) | Admin |
| GET | `/admin/bookings` | List all bookings | Admin |
| GET | `/admin/payments` | List payments/payouts | Admin |
| GET | `/admin/incidents` | List incidents | Admin |
| GET | `/admin/disputes` | List disputes | Admin |
| GET | `/admin/flags` | List account flags | Admin |
| POST | `/admin/actions/suspendUser` | Suspend user | Admin |
| POST | `/admin/actions/removeListing` | Remove/suspend listing | Admin |
| POST | `/admin/actions/holdPayout` | Hold host payout | Admin |
| GET | `/admin/auditLogs` | Query audit logs | Admin |

### List endpoints

- **Query:** Filters (status, date range, search), page, pageSize. Return full or summarized records for moderation and support.

### Action endpoints

- **suspendUser:** userId, reason, duration or indefinite. Sets users.suspended_at; logs to audit.
- **removeListing:** listingId, reason (e.g. policy). Sets status to suspended/archived; logs.
- **holdPayout:** payoutId, reason. Sets payout status to on_hold; logs.

### GET /admin/auditLogs

- **Query:** actorId, resourceType, resourceId, action, from, to, page, pageSize.
- **Response:** List of audit events (actor, action, resource, old/new values if stored, timestamp).

---

## 24. File and media APIs

**Base path:** `/v1/media`, `/v1/documents`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/media/upload` | Upload image/file | Authenticated |
| GET | `/media/{mediaId}` | Get URL or metadata | Owner or allowed context |
| DELETE | `/media/{mediaId}` | Delete media | Owner |
| POST | `/documents/upload` | Upload document (verification, dispute) | Authenticated |
| GET | `/documents/{documentId}` | Get document URL/metadata | Owner or allowed context |

### Upload

- **Request:** Multipart form or presigned URL flow. Optional context: listingId, verificationId, disputeId. Max size and allowed MIME types enforced.
- **Response:** mediaId/documentId, url (or download URL), contentType, size. URL may be signed and time-limited.

### Security

- **Listing photos:** Only listing owner can delete. **Verification documents:** Only owner and verification service. **Dispute evidence:** Only participant and admin. Validate context and ownership on every access.

---

## 25. Reporting and metrics APIs

**Base path:** `/v1/reports`

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| GET | `/reports/platform` | Platform-wide metrics | Admin |
| GET | `/reports/revenue` | Revenue report | Admin/Finance |
| GET | `/reports/bookings` | Booking report | Admin |
| GET | `/reports/incidents` | Incident/Trust & Safety report | Admin |
| GET | `/reports/hosts` | Host activity report | Admin |
| GET | `/reports/brokers` | Broker activity report | Admin |

### Query params

- **Common:** from, to, groupBy (day | week | month), format (json | csv), region (optional).
- **Response:** Aggregated metrics (counts, sums, time series). CSV for export.

### Use cases

- **Platform:** DAU/MAU, new signups, listings, bookings, GMV.
- **Revenue:** Revenue by source (guest fees, host fees, subscriptions), by region.
- **Bookings:** Count, cancellation rate, by listing/region.
- **Incidents:** Open/resolved counts, by type, MTTR.
- **Hosts/Brokers:** Active counts, top performers, compliance (verification, flags).

---

## 26. Authorization matrix

High-level mapping of **roles** to **API domains**. “Yes” = allowed with resource checks where applicable; “Own” = only own resources; “Admin” = admin-only.

| Domain | Guest | Host | Broker | Investor | Admin | Support |
|--------|-------|-----|--------|----------|-------|---------|
| Auth | Yes | Yes | Yes | Yes | Yes | Yes |
| Users (me, settings) | Yes | Yes | Yes | Yes | Yes | Yes |
| Verifications | Own | Own | Own (broker) | Own | View all | View all |
| Properties (marketplace) | Read | Create/Read/Own | Create/Read/Own | Read | Full | Read |
| Search | Yes | Yes | Yes | Yes | Yes | Yes |
| BNHub listings | Read | Create/Read/Own | Read | Read | Full | Read |
| Bookings | Own (guest) | Own (host) | — | — | Full | Read |
| Calendar | Read | Own listings | — | — | Full | Read |
| Payments | Own | Own (payouts) | — | — | Full | Read |
| Payouts | — | Own | — | — | Full | Read |
| Conversations | Own | Own | Own | Own | Read (support) | Full |
| Reviews | Create/Read | Create/Read | Read | Read | Full | Read |
| CRM | — | — | Own | — | Read | Read |
| Owner dashboard | — | Yes | — | Yes | Full | Read |
| Deals | Read | — | Create/Read/Own | Create/Read | Full | Read |
| Analytics | — | Own | Own | Yes | Full | Read |
| Incidents | Create/Own | Create/Own | Create/Own | Create/Own | Full | Full |
| Disputes | Create/Own | Create/Own | — | — | Full | Full |
| AI (scores, recommendations) | — | Own listing | — | Read | Full | Read |
| Notifications | Own | Own | Own | Own | Full | Full |
| Admin | — | — | — | — | Full | Limited |
| Media/Documents | Own | Own | Own | Own | Full | Full |
| Reports | — | — | — | — | Full | Limited |

**Resource-level rules:** “Own” means filter by userId (or listingId where host). Admin can override with scope. Support may have read-only or limited write (e.g. add note to incident).

---

## 27. Error handling standards

### Standard error response format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message.",
    "details": [
      { "field": "checkIn", "reason": "Must be in the future" }
    ],
    "requestId": "uuid",
    "timestamp": "ISO8601"
  }
}
```

### Error codes and HTTP mapping

| Code | HTTP | Usage |
|------|------|--------|
| VALIDATION_ERROR | 400 | Invalid input; details array for fields. |
| UNAUTHORIZED | 401 | Missing or invalid token. |
| FORBIDDEN | 403 | Valid token but insufficient permission. |
| NOT_FOUND | 404 | Resource does not exist or no access. |
| CONFLICT | 409 | Duplicate (e.g. idempotency key reuse with different body), or state conflict (e.g. cancel already cancelled). |
| RATE_LIMITED | 429 | Too many requests; Retry-After optional. |
| INTERNAL_ERROR | 500 | Unexpected server error; requestId for support. |

### Validation errors

- **details:** List of { field, reason } or { field, code, message }. Field may be nested (e.g. `pricing.nightlyCents`).

### Authentication errors

- **401:** Do not leak whether email exists. Message: “Invalid credentials” or “Token expired”.

### Authorization errors

- **403:** “You do not have permission to perform this action.” Do not reveal existence of resource if user should not know (optional 404 for sensitive resources).

### Rate limit errors

- **429:** Include Retry-After header and optional `limit`, `remaining`, `resetAt` in body.

### Consistency

- Always same top-level shape (`error` object). Use requestId in all 5xx and 4xx for logging; optional in 400 for validation.

---

## 28. API security standards

### Token-based authentication

- **Access token:** JWT or opaque; short-lived (e.g. 15–60 min). Sent as `Authorization: Bearer <token>`.
- **Refresh token:** Opaque; long-lived; stored server-side; used only at `/auth/refresh`. Rotate on use (optional).
- **Validation:** At API gateway or first service; validate signature (JWT) or lookup (opaque); reject expired or revoked.

### Refresh tokens

- Stored with user and device/session; revocable. On logout, invalidate refresh token. On compromise, invalidate all sessions for user.

### Rate limiting

- **Global:** Per IP (e.g. 1000 req/min). **Per user:** Per userId (e.g. 10000 req/min). **Sensitive:** Stricter on login, register, forgot-password (e.g. 5/15 min per IP or email).
- **Response:** 429 with Retry-After; X-RateLimit-* headers where applicable.

### Audit logging

- **Log:** All admin actions (suspend, remove listing, hold payout), payment confirm/refund, verification submit, dispute resolution. Include actorId, resourceType, resourceId, action, timestamp, requestId. No passwords or tokens in logs.

### Sensitive endpoint protection

- **MFA:** Optional or required for admin, payout account change, high-value actions. Enforce step-up for sensitive PATCH/DELETE.
- **Idempotency:** Required for payment confirm, refund, booking create (when payment involved).

### File upload security

- **Validate:** Content-Type and magic bytes; max size; allowed extension. Virus scan in production. Store in object storage with signed URLs; no direct execution.

### Webhook verification

- Outgoing webhooks (if any): sign payload (e.g. HMAC); document signature header. Partners verify using shared secret. Incoming webhooks (e.g. payment provider): verify signature before processing.

---

## 29. API versioning and lifecycle

### Versioning strategy

- **URL path:** `/v1/`, `/v2/`. Default when omitted: v1 (or via header `X-API-Version: 1`).
- **Major version:** Increment when breaking changes (remove/rename field or endpoint, change semantics). New version coexists with previous for deprecation period.

### Deprecation rules

- **Announce:** Deprecation at least 6 months before removal; header `X-API-Deprecation: true` and `X-API-Sunset: <date>` on deprecated endpoints.
- **Document:** Migration guide (old → new), timeline, and alternatives (e.g. use v2 field).

### Backward compatibility

- **Within vN:** Add optional fields only; do not remove fields or change meaning of existing fields. Optional query params can be added.
- **New required field:** Introduce in new version or add with default so existing clients still work.

### Migration guidance

- Provide changelog and migration snippets. Prefer one major version active plus one deprecated; then remove deprecated after sunset.

---

## 30. Integration architecture

### Mobile apps (iOS / Android)

- **Same REST APIs;** token in Authorization header. **Push:** Register device token via notifications API or dedicated endpoint; backend sends via FCM/APNs. **Deep links:** Map to resources (e.g. lecipm://bookings/{id}). **Offline:** Client caches read data; sync or refetch on reconnect; writes when online with conflict handling if needed.

### Web frontend

- **Same REST APIs;** token in cookie (session) or localStorage + header. **BFF (optional):** Per-client backend-for-frontend aggregates APIs and shapes responses for web. **SSR:** Server uses service account or user token to fetch; no token in HTML.

### Admin tools

- **Admin APIs only;** separate role; audit all mutations. **Auth:** Same auth APIs with admin role; or separate admin login and token scope.

### Third-party payment providers

- **Server-to-server:** Backend creates payment intent, confirms, processes refunds via provider SDK. **Webhooks:** Provider sends payment succeeded/failed; backend verifies signature, updates payment and booking, then responds 200. **Idempotency:** Use provider idempotency keys for create/refund.

### Identity verification providers

- **Redirect or SDK:** Backend creates applicant/session; user completes flow on provider; provider redirects or webhooks. **Status:** Backend polls or webhook; updates verification status and notifies user.

### Messaging / email services

- **Outbound:** Notification service calls email/SMS/push providers; templates and preferences in DB. **Inbound email (optional):** Parse reply-to for support; link to conversation and store.

### Analytics systems

- **Events:** Publish to event bus (booking confirmed, listing viewed); analytics pipeline consumes and loads to warehouse. **No PII in events** unless required and governed; use identifiers. **Reporting APIs:** Read from warehouse or aggregated DB; cached for admin reports.

### AI services

- **Input:** Events and APIs (listings, bookings, user attributes). **Output:** Risk scores, recommendations, forecasts stored in DB or cache; APIs read from there. **Sync vs async:** Risk score can be computed on-demand or async; pricing recommendations typically async batch; moderation queue updated on event.

---

## 31. Event and webhook model

### Platform events (internal)

Emitted by domain services; consumed by notifications, AI, analytics, Trust & Safety. Examples:

| Event | When | Payload (minimal) | Consumers |
|-------|------|-------------------|-----------|
| user.registered | After signup | userId, email, role | Analytics, Notification |
| user.verified | Verification completed | userId, verificationType | Trust & Safety, Listing |
| listing.created / updated | Listing save | listingId, userId, type, status | Search index, AI |
| listing.approved | Go-live | listingId | Notification, Search |
| booking.created | Booking created | bookingId, listingId, guestId, hostId, checkIn, checkOut | Payment, Notification, AI |
| booking.confirmed | Payment confirmed / host approved | bookingId | Notification, Calendar, AI |
| booking.cancelled | Cancellation | bookingId, reason, refundAmount | Payment, Notification, Analytics |
| booking.completed | After check-out | bookingId | Review eligibility, Analytics |
| payment.completed | Charge succeeded | paymentId, bookingId, amountCents | Payout, Notification |
| payout.held | Payout put on hold | payoutId, userId, reason | Notification, Admin |
| payout.paid | Payout sent | payoutId, userId, amountCents | Notification |
| incident.reported | New incident | incidentId, type, reporterId | Trust & Safety, Notification |
| review.submitted | Review published | reviewId, listingId, reviewerId, rating | Listing aggregate, AI |
| dispute.created | Dispute opened | disputeId, bookingId, type | Trust & Safety, Notification |

### Webhooks (outgoing to partners)

- **Purpose:** Notify partners (e.g. property managers, channel managers) of booking, cancellation, or listing change.
- **Security:** Sign payload (e.g. HMAC-SHA256); partner verifies with shared secret. **Retries:** Exponential backoff; document retry policy and max attempts. **Idempotency:** Partner uses event id to deduplicate.

### Webhooks (incoming from providers)

- **Payment provider:** payment_intent.succeeded, charge.refunded. Verify signature; update payment/refund and booking; respond 200 quickly; process async if needed.
- **Identity provider:** applicant.approved, applicant.rejected. Update verification status; notify user.

---

## 32. Final API blueprint summary

### Domains and endpoint groups

| # | Domain | Base path | Purpose |
|---|--------|-----------|---------|
| 1 | Auth | `/v1/auth` | Register, login, logout, refresh, password reset, email/phone verify |
| 2 | Users | `/v1/users` | Profile, settings, sessions |
| 3 | Verifications | `/v1/verifications` | Identity, address, business verification |
| 4 | Properties | `/v1/properties` | Marketplace listing CRUD, images, amenities, rules, analytics |
| 5 | Search | `/v1/search` | Properties, BNHub, deals, suggestions, filters, map |
| 6 | BNHub | `/v1/bnhub/listings` | Short-term listing CRUD, photos, pricing, availability, calendar |
| 7 | Bookings | `/v1/bookings` | Create, list, get, cancel, approve/decline, price breakdown, status history |
| 8 | Calendar | `/v1/calendar` | Get/update availability, block ranges |
| 9 | Payments | `/v1/payments` | Intent, confirm, history, refund, methods |
| 10 | Payouts | `/v1/payouts` | List, detail, accounts, reports |
| 11 | Messaging | `/v1/conversations` | List, create, messages, attachments |
| 12 | Reviews | `/v1/reviews`, `/v1/ratings` | Submit, list, report, aggregates |
| 13 | Broker CRM | `/v1/crm` | Leads, clients, listings, tasks, notes |
| 14 | Owner | `/v1/owner` | Properties, revenue, portfolio, maintenance, analytics |
| 15 | Deals | `/v1/deals` | CRUD, participants, messages, documents |
| 16 | Analytics | `/v1/analytics` | Market, property, portfolio, valuation, forecasts |
| 17 | Trust & Safety | `/v1/incidents`, `/v1/flags`, `/v1/suspensions` | Incidents, evidence, flags, suspensions |
| 18 | Disputes | `/v1/disputes` | Create, list, update, documents, messages, resolution |
| 19 | AI | `/v1/ai` | Risk scores, fraud alerts, pricing recommendations, forecasts, moderation, triage |
| 20 | Notifications | `/v1/notifications` | List, read, preferences, test |
| 21 | Admin | `/v1/admin` | Users, properties, bookings, payments, incidents, disputes, flags, actions, audit logs |
| 22 | Media | `/v1/media`, `/v1/documents` | Upload, get, delete |
| 23 | Reports | `/v1/reports` | Platform, revenue, bookings, incidents, hosts, brokers |

### Design principles applied

- **Scalable:** Stateless APIs; pagination and filtering; heavy reads via search index and caching.
- **Secure:** Token auth, role and resource authorization, rate limits, audit logging, no sensitive data in responses or logs.
- **Modular:** Domain-based paths; services can own their slice; events for cross-domain flow.
- **Versioned:** `/v1/` with deprecation and migration path.
- **Role-aware:** Authorization matrix and resource-level checks for guest, host, broker, investor, admin, support.

### How this supports LECIPM modules

| Module | Primary API domains |
|--------|---------------------|
| Real estate marketplace | Properties, Search, Deals (browse) |
| Broker CRM | Users, Verifications, Properties, CRM, Messaging, Notifications |
| BNHub short-term rentals | BNHub listings, Bookings, Calendar, Payments, Payouts, Messaging, Reviews |
| Owner dashboard | Owner, Properties, BNHub, Bookings, Payouts, Analytics, Maintenance |
| Deal marketplace | Deals, Search, Messaging, Documents |
| Investment analytics | Analytics, Deals, Owner |
| Trust & Safety | Incidents, Disputes, Flags, Suspensions, Verifications, Admin |
| AI Control Center | AI (read), Events (input); mutations via other domains |
| Mobile & Web | All domains; same contracts; client-specific handling in clients |

This blueprint is the single reference for implementing and evolving the LECIPM backend API. Implementations should follow the same structure, security, and error conventions so that web, iOS, Android, admin, broker, and owner experiences remain consistent and maintainable.

---

*References: [LECIPM Platform Architecture](LECIPM-PLATFORM-ARCHITECTURE.md), [LECIPM Database Schema Blueprint](LECIPM-DATABASE-SCHEMA-BLUEPRINT.md), [LECIPM Product Requirements Document](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md), [LECIPM Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md).*
