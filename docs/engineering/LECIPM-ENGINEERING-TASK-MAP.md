# LECIPM Platform — Engineering Task Map

**Decomposition of the platform into concrete development tasks**

This document breaks the LECIPM platform into implementable engineering tasks by module and layer. It is intended for developers and AI coding tools to build the system step-by-step. It aligns with the [Product Requirements Document](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md), [Master Product Roadmap](LECIPM-MASTER-PRODUCT-ROADMAP.md), and [Platform Architecture](LECIPM-PLATFORM-ARCHITECTURE.md).

---

## 1. Platform foundation tasks

Core infrastructure that all other modules depend on.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| F-01 | Create user database schema | Define and migrate `users` table: id, email, password_hash, name, phone, roles (array or junction), verification_status, locale, timezone, created_at, updated_at. Support soft delete. | Data |
| F-02 | Create user profile extensions | Add optional tables/fields for host (payout_details, stripe_account_id), broker (license_number, firm, region), guest (preferences). Link via user_id. | Data |
| F-03 | Build user service API | CRUD for users: create, get by id, get by email, update profile, update roles. Internal and authenticated endpoints only. | Service |
| F-04 | Build authentication service | Implement signup (email, password, name), login (email, password → token), logout (invalidate token), password reset (request + reset with token). Hash passwords with bcrypt or equivalent. | Service |
| F-05 | Implement token issuance and validation | Issue JWT or opaque token on login with user id, roles, expiry. Validate token on each request; attach user context to request. Refresh token flow if required. | Service |
| F-06 | Implement account registration flow | API and validation: email format, password policy (min length, complexity), duplicate email check. Optional: email verification (send link, verify before full access). | Service |
| F-07 | Implement login system | Login endpoint; rate limiting (e.g. 5 attempts per 15 min per IP); return token and user summary. Log failed attempts for security. | Service |
| F-08 | Create identity verification integration | Integrate with third-party provider (e.g. Onfido, Jumio): create applicant, upload document, run liveness, get result. Store verification_id and status (pending, verified, failed) on user. Webhook or poll for result. | Service |
| F-09 | Build identity verification status API | Endpoint for frontend to fetch verification status; endpoint for listing/booking flow to check “is_verified” before allowing host to publish. | Service |
| F-10 | Build role-based access control (RBAC) | Middleware or decorator: require role(s) per route (e.g. host for create_listing, admin for moderation). Deny with 403 if role missing. Central role definitions in config or DB. | Service |
| F-11 | Create API gateway or BFF routing | Single entry for clients: route /auth/* to auth service, /users/* to user service, /listings/* to listing service, etc. Attach user from token; forward to services. | Infrastructure |
| F-12 | Implement request logging and correlation ID | Log all API requests (method, path, user_id, status, latency). Add correlation_id to trace request across services. | Infrastructure |
| F-13 | Create application configuration and secrets management | Environment-based config (database URL, payment keys, verification provider keys). Secrets in env or vault; never in code. | Infrastructure |

---

## 2. Listing system tasks

Property listing data model, APIs, media, and moderation.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| L-01 | Create listing database model | Tables: listings (id, user_id, type [marketplace_sale, marketplace_rent, bnhub], status [draft, pending_review, live, suspended, archived], title, description, property_type, address, city, region, country, lat, lng, price, currency, ...), listing_amenities (listing_id, amenity_key). Support BNHub fields: nightly_price, cleaning_fee, max_guests, check_in_time, check_out_time, house_rules. | Data |
| L-02 | Create listing media storage model | Table listing_media (id, listing_id, url, type [photo], order, created_at). Store files in object storage (S3 or equivalent); store URL in DB. | Data |
| L-03 | Build listing creation API | POST /listings: validate body (title, type, location, price, etc.); create listing in draft or pending_review; require auth and host/broker role. Return listing id and status. | Service |
| L-04 | Build listing update API | PATCH /listings/:id: validate ownership or broker link; update allowed fields; if status change to live, run validation and optional re-review. Prevent edit of critical fields when live without re-review per policy. | Service |
| L-05 | Build listing get and list APIs | GET /listings/:id (public if live, else owner/admin). GET /listings (filter by user_id, status, type) for dashboard. | Service |
| L-06 | Create property image upload system | Endpoint: POST /listings/:id/media with multipart file. Validate type (image), size, dimensions. Upload to object storage; insert listing_media. Return url and id. Support ordering (order field). | Service |
| L-07 | Implement listing validation and completeness check | Function: required fields present (photos count, description length, address, price). Return list of missing items. Used before submit for review and in API. | Service |
| L-08 | Implement listing moderation workflow | State machine: draft → pending_review → live | rejected. Admin or automated job sets status. Rejection stores reason; host can edit and resubmit. On approval, emit event for search index. | Service |
| L-09 | Build listing search index pipeline | On listing created/updated/status change, publish event or call search service to index document (id, title, description, location, price, type, amenities, availability if BNHub). Use Elasticsearch or equivalent. | Service |
| L-10 | Implement listing soft delete and archive | Soft delete: set status to archived, hide from search and public API. Admin can restore. Hard delete only per data retention policy (e.g. anonymize). | Service |
| L-11 | Add marketplace-specific listing fields | For type marketplace_sale | marketplace_rent: sale_price or monthly_rent, beds, baths, sqft, year_built. Optional: broker_id. Validation per type. | Data/Service |
| L-12 | Add BNHub-specific listing fields and validation | Nightly price, cleaning fee, max guests, check-in/out, house rules. Validate min photos, no hidden fee text in description. | Service |

---

## 3. Search and discovery tasks

Search index, API, filters, and ranking.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| S-01 | Create search index schema | Define mapping for listing documents: text fields (title, description), keyword (city, region, type), geo (location), numeric (price, rating), date (availability). Index name with version for reindex. | Data |
| S-02 | Build search index ingestion | Service or job: consume listing events (created, updated, deleted); upsert or delete document in search engine. Idempotent by listing_id. | Service |
| S-03 | Create property search API | GET /search/listings: query params (q, city, region, lat, lng, radius_km, check_in, check_out, guests, min_price, max_price, property_type, amenities[], sort [relevance, price_asc, price_desc, rating], page, limit). Return listing ids and total; optionally return snippet. | Service |
| S-04 | Implement search filters | Apply filters in search query: date range (filter by availability calendar), price range, property type, amenities (term filters). Return only live listings. | Service |
| S-05 | Build geographic search | Geo-distance or geo-bounding box query. Support “near me” (lat/lng + radius) and “map bounds” (viewport). Return results with distance or relevance. | Service |
| S-06 | Implement sorting and ranking | Default sort: relevance (text score + recency). Optional: price_asc/desc, rating_desc. Ensure pagination is stable (e.g. sort by id when tie-breaking). | Service |
| S-07 | Integrate availability into search | For BNHub: filter out listings with no availability in check_in–check_out. Requires availability data in index or join with availability service at query time. Prefer index for performance. | Service |
| S-08 | Build listing detail API for discovery | GET /listings/:id/detail: full listing + aggregate rating + review count. Only for live listings or owner. Include availability summary (next 30 days) for BNHub. | Service |

---

## 4. BNHub booking system tasks

Availability, booking lifecycle, checkout, and confirmation.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| B-01 | Create availability calendar database model | Table availability or calendar_events: listing_id, date, status [available, blocked, booked], booking_id (if booked). Or slots with start/end. Unique (listing_id, date). | Data |
| B-02 | Create availability calendar API | GET /listings/:id/availability?start=&end= — return available/blocked/booked per date. POST /listings/:id/availability/block — host blocks dates. DELETE to unblock. | Service |
| B-03 | Implement availability sync on booking | When booking is confirmed, block dates in availability table. When booking is cancelled, release dates. Use transaction or outbox to keep consistent. | Service |
| B-04 | Create booking database model | Table bookings: id, listing_id, guest_id, check_in, check_out, guests, status [reserved, confirmed, cancelled, completed], total_amount, currency, payment_status, created_at, updated_at. Optional: host_id denormalized. | Data |
| B-05 | Build availability check function | Given listing_id, check_in, check_out, guests: query availability and min/max stay rules; return boolean available and optional message. Used by search and by booking creation. | Service |
| B-06 | Build booking price calculation service | Input: listing_id, check_in, check_out, guests. Output: nightly_total, cleaning_fee, platform_guest_fee, tax, total. Use listing pricing and platform fee config. Idempotent for same inputs. | Service |
| B-07 | Build booking creation API (with payment) | POST /bookings: body listing_id, check_in, check_out, guests, idempotency_key. Validate availability and pricing; create payment intent and charge (via payment service); on success create booking and block calendar; emit BookingConfirmed event. Return booking id and confirmation. | Service |
| B-08 | Implement reservation management API | GET /bookings (for guest: my bookings; for host: for my listings). GET /bookings/:id. PATCH /bookings/:id/cancel — cancel with policy (refund calculation); release calendar; update payment (refund). | Service |
| B-09 | Implement guest checkout flow (backend) | Checkout = availability check + price calc + payment charge + booking create + notification. Expose as single API or orchestrated flow. Return booking and receipt. | Service |
| B-10 | Create booking confirmation and receipt | On booking created: generate receipt (itemized); send email and in-app notification with booking details and receipt. Template with listing, dates, total, confirmation number. | Service |
| B-11 | Implement min/max stay rules | Store min_nights, max_nights per listing or per date range. Enforce in availability check and booking creation. Return clear error if violated. | Service |
| B-12 | Build booking state machine | Transitions: confirmed → cancelled | completed (after check_out date). Completed triggers review window and payout schedule. No double cancel. | Service |

---

## 5. Payment system tasks

Payment provider integration, charges, escrow, payouts, and refunds.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| P-01 | Integrate payment provider API | Integrate Stripe (or equivalent): create customer, attach payment method, create payment intent, confirm. Use idempotency keys. Store payment_method_id and customer_id on user (tokenized). | Service |
| P-02 | Create payment and payout database models | Tables: payments (id, booking_id, amount, currency, status, stripe_payment_intent_id, fee_breakdown, created_at); payouts (id, user_id, amount, currency, status, stripe_payout_id, scheduled_at, paid_at, related_payment_ids). | Data |
| P-03 | Implement guest charge flow | On booking: create payment intent for total; confirm; on success store payment record and link to booking. Handle 3DS if required. Return payment id and status. | Service |
| P-04 | Implement escrow/hold logic | If product uses hold: do not transfer to host immediately; mark payment as held. Release when conditions met (e.g. X days after checkout, no dispute). Use provider’s transfer or hold API. | Service |
| P-05 | Create payout calculation job | Job: for each completed booking past release date, compute host payout (booking total minus platform commission, minus refunds). Create payout record in pending; queue for provider transfer. | Service |
| P-06 | Implement payout execution | Call provider to transfer funds to host’s connected account or bank. Update payout status to paid or failed. On failure, retry and notify host. Store payout method on user (bank account or Stripe Connect). | Service |
| P-07 | Build payout method API | Host adds bank account or connects Stripe Connect account. Validate and store. GET /users/me/payout-methods. | Service |
| P-08 | Build refund processing | Input: booking_id or payment_id, amount, reason. Call provider refund API; update payment and booking; if partial, adjust host payout. Idempotent by refund request id. | Service |
| P-09 | Create transaction history API | GET /users/me/payments (guest); GET /users/me/payouts (host). Filter by date, status. Paginate. | Service |
| P-10 | Implement platform fee and tax calculation | Config: guest_fee_percent, host_commission_percent. Tax: lookup by region; add tax amount to total and store. Fee breakdown in payment record for receipt. | Service |
| P-11 | Handle payment failures and retries | On charge failure return clear error to user. Optional: retry logic for transient failures. Log failures for support. | Service |

---

## 6. Messaging system tasks

Conversations, messages, and notification triggers.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| M-01 | Create conversation and message database models | Tables: threads (id, type [booking, support], booking_id optional, created_at); thread_participants (thread_id, user_id, role); messages (id, thread_id, sender_id, body, created_at, read_at). | Data |
| M-02 | Build thread creation logic | Create thread when booking is confirmed (guest + host). Or on first message. One thread per booking for guest-host. | Service |
| M-03 | Build messaging API | POST /threads/:id/messages — send message (body); validate participant. GET /threads — list threads for user. GET /threads/:id/messages — list messages with pagination. PATCH message read_at. | Service |
| M-04 | Implement real-time messaging (optional) | WebSocket or SSE: subscribe to thread; push new messages to participants. Fallback: poll or long-poll. Ensure order and exactly-once delivery. | Service |
| M-05 | Create notification service | Table notifications (id, user_id, type, channel [email, push, in_app], payload, read_at, sent_at). Template engine: map event type to subject/body. Send email via provider (SendGrid, SES); push via FCM/APNs. | Service |
| M-06 | Implement notification triggers | On events: BookingConfirmed, BookingCancelled, PayoutSent, NewMessage, ReviewReceived, IncidentUpdate. Subscribe to events; create notification and send per user preferences. | Service |
| M-07 | Build notification preferences API | GET/PATCH /users/me/notification-preferences: by channel and type (e.g. email_booking_on, push_message_on). Respect in send. | Service |
| M-08 | Implement in-app notification list API | GET /users/me/notifications?limit=&offset=. Mark as read. | Service |

---

## 7. Review and rating system tasks

Reviews, moderation, and reputation.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| R-01 | Create review database schema | Table reviews: id, booking_id, listing_id, reviewer_id, reviewee_id (host or guest), role [guest_review, host_review], rating (1-5), comment (text), status [pending, published, removed], created_at. Unique (booking_id, role) per side. | Data |
| R-02 | Build review submission API | POST /bookings/:id/review — submit review after checkout. Validate: one review per booking per role; within time window (e.g. 14 days). Store with status pending or published (if no moderation). | Service |
| R-03 | Implement review moderation | Queue for moderation: keyword filter or manual. Actions: approve (publish), remove (with reason). Update status. Notify reviewer if removed. | Service |
| R-04 | Calculate and store aggregate ratings | On review published: update listing aggregate (avg rating, count) and user aggregate (as host, as guest). Store in listing and user tables or separate aggregates table. | Service |
| R-05 | Build review list API | GET /listings/:id/reviews — published reviews with pagination. GET /users/:id/reviews — reviews received (for profile). | Service |
| R-06 | Implement review window logic | After check_out date, open review window for both sides. Either both submit or window expires; then publish both (or one). Per product policy. | Service |

---

## 8. Trust & Safety tasks

Verification, fraud signals, incidents, and enforcement.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| T-01 | Implement identity verification gating | Before listing can go live, check user.verification_status === verified. Return clear error and link to verification flow if not. | Service |
| T-02 | Create incident database model | Table incidents: id, reporter_id, reported_user_id, reported_listing_id, booking_id, type [safety, fraud, policy, payment, other], description, status [open, in_progress, resolved], priority, assignee_id, resolution_notes, created_at, updated_at. | Data |
| T-03 | Build incident reporting API | POST /incidents — create incident (type, description, reported_entity ids). Auth required. Return incident id. Send confirmation to reporter. | Service |
| T-04 | Build incident management API (admin) | GET /admin/incidents (filter, sort). GET /admin/incidents/:id. PATCH assign, status, resolution. Require admin role. Audit log for actions. | Service |
| T-05 | Create fraud detection signals (rules) | Rules: duplicate listing (same address or similar images), first booking high value, payment velocity, new account + instant book. Score or flag; store in risk_scores table or incident. | Service |
| T-06 | Implement account suspension system | Field user.suspended_at, user.suspension_reason. When set: reject login or restrict actions (no book, no list). API for admin to set/clear. Notify user. | Service |
| T-07 | Implement listing suspension | Set listing status to suspended. Hide from search and detail. Admin only. Reason stored. Host notified. | Service |
| T-08 | Build dispute workflow and database | Table disputes: id, booking_id, claimant_id, type [refund, conduct], description, status [open, in_progress, resolved], resolution [refund_full, refund_partial, no_refund], resolution_amount, resolver_id, created_at. Link to incident if from report. | Data |
| T-09 | Build dispute resolution API | POST /disputes (create from booking or incident). GET /disputes (admin or participant). PATCH resolve (admin): set resolution and trigger refund if applicable. | Service |
| T-10 | Implement payout hold for high-risk | When risk score or rule triggers hold: set payout status to on_hold; do not run payout job for that user until cleared. Admin can release with reason. | Service |

---

## 9. Broker CRM tasks

Client, lead, and listing management for brokers.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| C-01 | Create client/contact database model | Table contacts: id, broker_id (user_id), name, email, phone, source, notes, created_at. Optional: company, tags. | Data |
| C-02 | Create lead database model | Table leads: id, listing_id, broker_id, contact_id optional, name, email, phone, message, source [marketplace_form, bnhub_contact], status [new, contacted, qualified, lost, won], created_at. | Data |
| C-03 | Build client management API | CRUD contacts for broker. GET /broker/contacts. POST/PATCH/DELETE contact. List with search and filter. | Service |
| C-04 | Build lead tracking API | GET /broker/leads. POST /broker/leads (manual). PATCH status, assign to contact. When form submitted on listing, create lead and link to broker (listing’s broker_id). | Service |
| C-05 | Build broker dashboard data API | Aggregates: my listings count, my leads count, unread messages count. List recent listings, recent leads. GET /broker/dashboard. | Service |
| C-06 | Implement broker listing association | When broker creates listing, set listing.broker_id. Broker sees all listings where broker_id = me. Optional: referral flow (invite owner, owner claims listing). | Service |
| C-07 | Create broker profile and verification | Broker profile: firm, license_number, region. Verification: admin or integration sets broker_verified_at. Badge shown on listing and profile. | Service |
| C-08 | Implement lead capture from listing form | On marketplace or BNHub “Contact” submit: create lead with listing_id, broker_id from listing; notify broker. | Service |

---

## 10. Owner dashboard tasks

Portfolio, revenue, and performance for owners.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| O-01 | Build portfolio list API | GET /owner/listings — all listings for user (marketplace + BNHub). Include status, key metrics (next booking, revenue YTD if available). | Service |
| O-02 | Implement revenue analytics aggregation | Per listing: sum payments for completed bookings in period; occupancy = nights_booked / nights_available. Query payments and bookings; cache or materialize for dashboard. | Service |
| O-03 | Create owner dashboard summary API | GET /owner/dashboard: total listings, total revenue (current month, YTD), upcoming bookings, recent payouts. | Service |
| O-04 | Build payout history for owner | Reuse GET /users/me/payouts; filter by user. Show in owner dashboard. | Service |
| O-05 | Create maintenance tracking tables (optional) | Tables: maintenance_requests (id, listing_id, type, description, status, assigned_to, created_at). CRUD API for owner. Optional for MVP. | Data/Service |

---

## 11. Deal marketplace tasks

Investment opportunities and investor tools.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| D-01 | Create deal database model | Table deals: id, owner_id (user/broker), title, description, type [off_market, partnership, development], location, price_or_terms, visibility [public, invite_only], status [draft, published], created_at. | Data |
| D-02 | Build deal creation and update API | POST /deals (broker or qualified user). PATCH /deals/:id. Validate required fields. Publish sets status; optional moderation. | Service |
| D-03 | Build deal search and list API | GET /deals: filter by region, type, visibility (public only for non-owner). Sort by date. Return deal list and detail. | Service |
| D-04 | Implement expression of interest | POST /deals/:id/interest — name, email, message. Create record (deal_interest or lead); notify deal owner. Table: deal_interests (id, deal_id, user_id or email, message, created_at). | Service |
| D-05 | Build deal communication (messaging) | Create thread linking deal and interested user; deal owner can message from CRM or deal dashboard. Reuse messaging service with thread type “deal”. | Service |
| D-06 | Implement deal analytics (views, interest count) | Track deal_views (deal_id, user_id, created_at) and count interests. GET /deals/:id/analytics for owner. | Service |

---

## 12. Investment analytics tasks

Market data, valuation, and portfolio analytics.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| A-01 | Create analytics data pipeline | ETL: export bookings, listings, payments (aggregated) to warehouse or analytics DB. Schedule daily or hourly. No PII in aggregates; only counts, sums, and grouped dimensions. | Infrastructure |
| A-02 | Build property valuation model (simple) | Input: address or listing_id. Output: estimated value or range. Use comparables (similar listings’ prices) or external API if integrated. Store version and disclaimer. | Service |
| A-03 | Create investment analytics dashboard API | GET /analytics/market-insights: by region, avg yield, occupancy trend (from aggregated bookings). GET /analytics/portfolio: for user’s listings, revenue and occupancy. Require subscription or role. | Service |
| A-04 | Implement market data aggregation | Aggregate: by city/region, avg nightly price, occupancy rate, booking count. Refresh periodically. Expose via API for dashboard and valuation. | Service |
| A-05 | Build portfolio performance API | For user’s listings: revenue by period, occupancy, avg rate. Comparison to market average if data available. GET /owner/analytics/performance. | Service |
| A-06 | Implement export and reporting | Export portfolio or market data to CSV/PDF. Scheduled or on-demand. Access control by role and subscription. | Service |

---

## 13. AI Control Center tasks

Fraud, risk, pricing, and support automation.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| AI-01 | Implement fraud detection rules engine | Rules: duplicate listing (address or image hash), new user + high value booking, payment velocity. Output: fraud_score, flags[], reason_codes. Store per user/booking; expose to admin and payout flow. | Service |
| AI-02 | Create risk scoring pipeline | Input: user (reviews, cancellations, disputes, verification). Output: risk_score 0–100. Batch job or on-event. Store user_risk_scores (user_id, score, components, updated_at). Use for ranking and hold. | Service |
| AI-03 | Build dynamic pricing recommendation service | Input: listing_id, dates. Output: suggested_nightly_price, range. Use comparables and demand signal (optional). API for host dashboard; host applies manually. | Service |
| AI-04 | Implement demand forecasting job | Aggregate bookings and search by region and date; produce demand index or forecast. Store or expose to pricing and analytics. Simple model (e.g. moving average) for v1. | Service |
| AI-05 | Implement content moderation pipeline | On listing/review/message create or update: run keyword or ML model; flag if violation. Queue for human review. Actions: approve, remove. Reason codes. | Service |
| AI-06 | Build support triage (classification) | On new support ticket: classify type (refund, technical, safety) and priority. Store suggested_category; route to queue. Optional: suggest FAQ or template. | Service |
| AI-07 | Expose AI outputs via API | GET /admin/users/:id/risk, GET /admin/bookings/:id/fraud_flags. For internal use only. | Service |
| AI-08 | Implement audit log for AI decisions | Log when score or flag is used to block or hold (e.g. payout hold due to fraud score). Store decision, score, timestamp for audit. | Service |

---

## 14. Admin dashboard tasks

Moderation, incidents, financial monitoring, and platform analytics.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| AD-01 | Create moderation queue API | GET /admin/moderation/listings (pending_review, reported). GET /admin/moderation/reviews, /messages. Actions: approve, reject, remove with reason. Audit log. | Service |
| AD-02 | Build incident management UI backend | Full CRUD and list for incidents; assign, add note, resolve. Already in T-04; add filters and bulk actions if needed. | Service |
| AD-03 | Implement financial monitoring API | GET /admin/payments, /admin/payouts with filters. GET /admin/payouts/holds. Read-only for finance role. Export for reconciliation. | Service |
| AD-04 | Create platform analytics API | GET /admin/analytics/overview: active_users, active_listings, bookings_count, gmv, revenue (fees) in period. By region if multi-region. Dashboards consume this. | Service |
| AD-05 | Build user and listing admin APIs | GET /admin/users/:id (full profile, verification, risk, bookings count). PATCH suspend, unsuspend. GET /admin/listings/:id, PATCH suspend. Require admin role. | Service |
| AD-06 | Implement audit logging for admin actions | Log all admin PATCH (suspend, resolve, approve, etc.) with admin_id, resource, action, reason, timestamp. Query API for compliance. | Service |

---

## 15. Mobile application tasks

Web, iOS, and Android clients.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| MO-01 | Build responsive web app shell | Layout: header (logo, nav, auth), footer, main content area. Routing for /, /search, /listings/:id, /bookings, /dashboard, /account. Auth gate for protected routes. | Frontend |
| MO-02 | Implement web login and registration screens | Forms: login (email, password), signup (email, password, name), forgot password. Call auth API; store token; redirect. Handle errors and validation. | Frontend |
| MO-03 | Create property search interface (web) | Search form: location, dates, guests. Results list and map view. Filters sidebar. Sort. Link to listing detail. Call search API. | Frontend |
| MO-04 | Build listing detail page (web) | Photo gallery, description, amenities, map, reviews, price for dates, “Book” CTA. Call listing and availability APIs. | Frontend |
| MO-05 | Implement booking/checkout flow (web) | Dates and guests selection; price summary; payment form (card); submit to booking API; confirmation page and receipt. Handle 3DS if needed. | Frontend |
| MO-06 | Build host dashboard (web) | Tabs: Listings, Calendar, Bookings, Payouts, Messages. List and edit listings; calendar view and block; booking list; payout history; message threads. | Frontend |
| MO-07 | Build “My trips” and messaging (web) | Guest: list upcoming and past bookings; detail and cancel; message thread per booking. Reuse messaging component. | Frontend |
| MO-08 | Implement push notifications (web) | Web Push: subscribe to notifications; backend sends push on NewMessage, BookingConfirmed, etc. Optional. | Frontend |
| MO-09 | Create iOS app project and auth | Native iOS (Swift/SwiftUI or React Native): login, signup, token storage in keychain. API client with token. | Mobile |
| MO-10 | Build iOS search and booking flow | Search screen, listing detail, checkout (web view or native). Same API as web. Deep link from push to booking or message. | Mobile |
| MO-11 | Create Android app project and auth | Native Android (Kotlin or React Native): login, signup, token in secure storage. API client. | Mobile |
| MO-12 | Build Android search and booking flow | Mirror iOS: search, detail, checkout. Push via FCM; deep link. | Mobile |
| MO-13 | Implement mobile push notifications | Register device with backend; send push via FCM (Android) and APNs (iOS). Payload: title, body, deep_link. | Service |
| MO-14 | Secure storage for tokens and sensitive data | Mobile: store token and refresh token in keychain (iOS) / Keystore (Android). Never log tokens. | Mobile |

---

## 16. Security tasks

Authentication, encryption, audit, and secure payment flows.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| SEC-01 | Implement secure password hashing | Use bcrypt or Argon2 for passwords. Never log or return password. Minimum length and complexity enforced at signup. | Service |
| SEC-02 | Implement authentication tokens | JWT: sign with secret or RS256; include user_id, roles, exp. Short-lived access token; optional refresh token. Validate on every request. | Service |
| SEC-03 | Encrypt sensitive data at rest | Encrypt PII fields (e.g. phone) or use DB-level encryption. Payment method tokens stored per provider best practice. Keys in vault or KMS. | Infrastructure |
| SEC-04 | Enforce HTTPS and secure headers | TLS only for all endpoints. Headers: HSTS, X-Content-Type-Options, etc. | Infrastructure |
| SEC-05 | Implement audit logging | Log: auth events (login, fail), admin actions, payment events, status changes. Store in audit table or log aggregate; retain per policy. | Service |
| SEC-06 | Secure payment flows | No card data in app; use provider’s elements or redirect. Idempotency for charge and refund. Validate amount and booking before charge. | Service |
| SEC-07 | Implement rate limiting | Rate limit login, signup, and payment endpoints per IP and per user. Return 429 with Retry-After. | Service |
| SEC-08 | Implement authorization checks on all mutations | Every POST/PATCH/DELETE: verify user can act on resource (owner, broker, admin). Return 403 if not. Centralize in middleware or service layer. | Service |

---

## 17. Infrastructure tasks

Cloud, database, storage, and monitoring.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| INF-01 | Configure cloud project and networking | Create project (e.g. AWS/GCP account); VPC, subnets, security groups. No public DB; only app and gateway in public subnet or behind LB. | Infrastructure |
| INF-02 | Deploy database servers | Provision primary DB (e.g. PostgreSQL RDS). Run migrations. Create read replica for read-heavy paths. Backup and point-in-time recovery enabled. | Infrastructure |
| INF-03 | Set up object storage for media | Bucket for listing images and documents. Presigned URLs for upload; public or CDN URL for read. CORS and lifecycle policies. | Infrastructure |
| INF-04 | Set up search engine cluster | Deploy Elasticsearch or OpenSearch. Index creation and mapping. No public access; app connects internally. | Infrastructure |
| INF-05 | Implement load balancing | Load balancer in front of app instances. Health check on /health. SSL termination at LB. | Infrastructure |
| INF-06 | Set up monitoring and alerting | Metrics: latency, error rate, throughput per API. Logs aggregation. Alerts: error spike, latency p95 > threshold, DB connections. Dashboard for ops. | Infrastructure |
| INF-07 | Configure CI/CD pipeline | Build on commit (test, lint); deploy to staging on main. Deploy to production on tag or manual. Secrets in CI env. | Infrastructure |
| INF-08 | Set up staging and production environments | Staging: copy of prod config, test data. Production: prod DB, prod payment (or test mode), prod domains. Feature flags for gradual rollout. | Infrastructure |

---

## 18. Testing tasks

Unit, integration, security, and performance tests.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| TE-01 | Write unit tests for core services | Tests for: auth (hash, token), listing validation, price calculation, availability check, booking state machine. High coverage for payment and booking logic. | Test |
| TE-02 | Write API integration tests | Test full flow: create user → login → create listing → search → create booking (with mock payment) → cancel. Use test DB and mock provider. | Test |
| TE-03 | Write payment integration tests (sandbox) | Use provider sandbox: create customer, attach card, charge, refund. Assert payment and payout records. | Test |
| TE-04 | Conduct security testing | Dependency scan (e.g. npm audit, Snyk). Auth: invalid token, expired token, wrong role. No sensitive data in logs or responses. Optional: penetration test. | Test |
| TE-05 | Run performance and load tests | Load test: search and booking creation at target RPS. Assert p95 latency and error rate. Identify bottlenecks. | Test |
| TE-06 | Implement test data and fixtures | Seed data for staging: sample users, listings, bookings. Script to reset and reseed. | Test |

---

## 19. Deployment tasks

CI/CD, staging, and production deployment.

| Task ID | Task | Description | Layer |
|---------|------|-------------|-------|
| DP-01 | Create CI pipeline | On push: install deps, run lint, run unit tests, build app. Fail pipeline on failure. Report status to repo. | DevOps |
| DP-02 | Create CD pipeline for staging | On merge to main (or nightly): build image, run migrations (if any), deploy to staging. Smoke test staging URLs. | DevOps |
| DP-03 | Deploy production environment | Deploy to production on tag or manual approval. Migrations run with backup. Blue-green or rolling update. Health check before traffic switch. | DevOps |
| DP-04 | Implement rollback procedure | Rollback to previous image if post-deploy checks fail. Document steps. DB migrations: forward-only; rollback script only if safe. | DevOps |
| DP-05 | Document runbooks | Runbooks: deploy, rollback, scale, restart, clear cache, investigate incident. On-call and escalation. | DevOps |

---

## 20. Task prioritization

Tasks are grouped into development waves. Complete Wave 1 before relying on Wave 2; Waves 2–4 can overlap once dependencies are met.

### Wave 1 — Core platform foundation

**Goal:** User accounts, auth, verification, listings, search, booking, payment, messaging, reviews working end-to-end on web.

| Task IDs | Focus |
|----------|--------|
| F-01 through F-13 | User schema, auth, registration, login, identity verification, RBAC, API gateway, config |
| L-01 through L-12 | Listing model, CRUD, media upload, validation, moderation, search index |
| S-01 through S-08 | Search index, ingestion, search API, filters, geo, ranking, detail API |
| B-01 through B-12 | Availability, booking model, price calc, booking API, checkout, confirmation, state machine |
| P-01 through P-11 | Payment provider, charge, escrow, payout calc and execution, refunds, history |
| M-01 through M-08 | Threads, messages, notifications, triggers |
| R-01 through R-06 | Reviews schema, submit, moderation, aggregates, list API |
| MO-01 through MO-08 | Web app: shell, auth, search, detail, checkout, host dashboard, my trips, notifications |
| SEC-01 through SEC-08 | Password hashing, tokens, encryption, audit, rate limit, authorization |
| INF-01 through INF-08 | Cloud, DB, storage, search cluster, LB, monitoring, CI/CD, staging/prod |
| TE-01 through TE-06, DP-01 through DP-05 | Tests and deployment |

**Outcome:** Guest can sign up, search, book, pay, and see confirmation. Host can sign up, verify, create listing, receive booking and payout. Messaging and reviews work.

---

### Wave 2 — Marketplace and Trust & Safety

**Goal:** Trust & Safety flows, fraud signals, incidents, disputes, and admin tools. BNHub and marketplace stable.

| Task IDs | Focus |
|----------|--------|
| T-01 through T-10 | Verification gating, incidents, fraud rules, suspension, disputes, payout hold |
| AD-01 through AD-06 | Moderation queue, incident UI backend, financial monitoring, platform analytics, user/listing admin, audit log |
| AI-01, AI-02, AI-07, AI-08 | Fraud rules engine, risk scoring pipeline, expose to admin, audit log for AI |

**Outcome:** Incidents and disputes are reported and resolved. Moderation and admin dashboard operational. Basic fraud and risk in place.

---

### Wave 3 — Professional tools and analytics

**Goal:** Broker CRM, owner dashboard, deal marketplace, and investment analytics.

| Task IDs | Focus |
|----------|--------|
| C-01 through C-08 | Contacts, leads, broker dashboard, listing association, verification, lead capture |
| O-01 through O-05 | Portfolio API, revenue aggregation, dashboard summary, payout history, maintenance (optional) |
| D-01 through D-06 | Deals model, CRUD, search, expression of interest, messaging, analytics |
| A-01 through A-06 | Analytics pipeline, valuation, market insights, portfolio performance, export |

**Outcome:** Brokers manage clients and leads; owners see portfolio and revenue; investors discover deals and view analytics.

---

### Wave 4 — AI systems and optimization

**Goal:** Dynamic pricing, demand forecasting, content moderation, support triage, and mobile apps.

| Task IDs | Focus |
|----------|--------|
| AI-03 through AI-06 | Dynamic pricing recommendation, demand forecasting, content moderation, support triage |
| MO-09 through MO-14 | iOS and Android apps: auth, search, booking, push, secure storage |
| Search and API optimizations | Caching, query tuning, CDN for assets; performance to meet SLOs |

**Outcome:** AI supports pricing and moderation; native mobile apps live; platform meets performance targets.

---

## Summary table

| Wave | Theme | Key task areas |
|------|--------|----------------|
| 1 | Foundation | Users, auth, verification, listings, search, booking, payment, messaging, reviews, web app, security, infra, tests, deploy |
| 2 | Trust & Safety | Incidents, disputes, fraud/risk, moderation, admin dashboard |
| 3 | Professional & analytics | Broker CRM, owner dashboard, deal marketplace, investment analytics |
| 4 | AI & mobile | Pricing, demand, moderation, triage, iOS/Android, optimization |

---

*This document is the Engineering Task Map for the LECIPM platform. Use it with the [PRD](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md) and [Master Product Roadmap](LECIPM-MASTER-PRODUCT-ROADMAP.md) to plan sprints and assign work. Update task IDs and waves as the plan evolves.*
