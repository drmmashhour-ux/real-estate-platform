# LECIPM Platform — Database Schema Blueprint

**Structured data model for the LECIPM ecosystem**

This document defines the database schema for the LECIPM platform: main entities, relationships, key fields, indexing, security, and scalability. It supports real estate marketplace, BNHub, Broker CRM, Owner dashboard, Deal marketplace, Investment analytics, Trust & Safety, and AI systems. It aligns with the [Platform Architecture](LECIPM-PLATFORM-ARCHITECTURE.md), [Product Requirements Document](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md), and [Engineering Task Map](LECIPM-ENGINEERING-TASK-MAP.md). Backend engineers can implement or migrate to this model. The existing [Prisma schema](apps/web/prisma/schema.prisma) implements a subset; this blueprint describes the full target model.

---

## 1. Database design philosophy

### Goals of the data architecture

| Principle | Application |
|-----------|-------------|
| **Scalability** | Schema supports horizontal scaling via read replicas and partitioning by tenant or time where needed. Normalized transactional store; heavy analytics offloaded to warehouse. |
| **Data integrity** | Foreign keys and constraints enforce referential integrity. Critical flows (booking, payment) use transactions. Idempotency keys where applicable (payments, refunds). |
| **Security** | Sensitive fields (password_hash, payment tokens) are never logged or exposed via API. Encryption at rest for PII and financial data. Access controlled by application role; audit log for admin and sensitive actions. |
| **Performance optimization** | Indexes on high-query paths (user_id, listing_id, booking status, payment status, created_at). Search is served by a separate search index, not full table scan. Hot data may be cached. |
| **Support for analytics and AI** | Transactional DB is source of truth. Events (booking confirmed, review submitted) feed analytics warehouse and AI feature store. AI outputs (risk scores, recommendations) stored in dedicated tables with clear ownership. |

### Conventions

- **Primary keys:** UUID (e.g. `uuid()`) for all main entities to support distribution and avoid enumeration.
- **Timestamps:** `created_at`, `updated_at` on all tables; `deleted_at` for soft delete where required.
- **Naming:** Snake_case for table and column names in this document; adapt to Prisma (camelCase) or ORM as needed.
- **Currency:** Store amounts in smallest unit (cents) with `currency` (ISO 4217) to avoid float rounding errors.
- **Enums:** Status and type fields use application-controlled enums; store as string or smallint in DB.

---

## 2. Core user tables

### users

Central identity table. One row per platform account.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Primary key. |
| email | VARCHAR(255) UNIQUE NOT NULL | Login identifier. |
| password_hash | VARCHAR(255) | Bcrypt or Argon2 hash; NULL if OAuth-only. |
| name | VARCHAR(255) | Display name. |
| phone | VARCHAR(50) | Optional. |
| locale | VARCHAR(10) | e.g. en_CA, fr_CA. |
| timezone | VARCHAR(50) | Optional. |
| verification_status | ENUM | pending, verified, failed. Identity verification result. |
| verification_provider_id | VARCHAR(255) | External verification applicant id. |
| verification_completed_at | TIMESTAMPTZ | When verification was completed. |
| suspended_at | TIMESTAMPTZ | If set, account is suspended. |
| suspension_reason | TEXT | Admin-set reason. |
| last_login_at | TIMESTAMPTZ | Last successful login. |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| deleted_at | TIMESTAMPTZ | Soft delete. |

### user_roles

User can have multiple roles (guest, host, broker, investor). Admin is separate.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users NOT NULL | |
| role | ENUM NOT NULL | guest, host, broker, investor. |
| created_at | TIMESTAMPTZ NOT NULL | |
| UNIQUE(user_id, role) | | |

### user_profiles (optional extensions)

Role-specific profile data to avoid wide users table.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users UNIQUE NOT NULL | |
| profile_type | ENUM | host, broker, guest. |
| payout_stripe_account_id | VARCHAR(255) | Host payout (Stripe Connect or similar). |
| payout_currency | VARCHAR(3) | Default payout currency. |
| broker_license_number | VARCHAR(100) | For profile_type = broker. |
| broker_firm | VARCHAR(255) | |
| broker_region | VARCHAR(100) | |
| broker_verified_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### user_sessions (optional)

For token invalidation or session listing. If using stateless JWT, may be omitted.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users NOT NULL | |
| token_hash | VARCHAR(255) | Hash of token for lookup. |
| expires_at | TIMESTAMPTZ NOT NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |

---

## 3. Property and listing tables

Unified listing model for marketplace (sale, long-term rent) and BNHub (short-term). Type discriminator and optional BNHub-specific table or JSON.

### listings

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users NOT NULL | Owner/lister. |
| broker_id | UUID FK → users | Optional; if listed by broker. |
| type | ENUM NOT NULL | marketplace_sale, marketplace_rent, bnhub. |
| status | ENUM NOT NULL | draft, pending_review, live, suspended, archived. |
| title | VARCHAR(500) NOT NULL | |
| description | TEXT | |
| property_type | VARCHAR(100) | apartment, house, etc. |
| address | VARCHAR(500) NOT NULL | |
| city | VARCHAR(100) NOT NULL | |
| region | VARCHAR(100) | State/province. |
| country | VARCHAR(2) NOT NULL | ISO 3166-1 alpha-2. |
| latitude | DECIMAL(10,7) | |
| longitude | DECIMAL(10,7) | |
| price_cents | INT | Sale price or monthly rent (marketplace). |
| currency | VARCHAR(3) NOT NULL | |
| nightly_price_cents | INT | BNHub only. |
| cleaning_fee_cents | INT | BNHub; default 0. |
| max_guests | INT | BNHub. |
| bedrooms | INT | |
| beds | INT | |
| baths | DECIMAL(4,2) | |
| check_in_time | TIME | BNHub. |
| check_out_time | TIME | BNHub. |
| house_rules | TEXT | BNHub. |
| min_nights | INT | BNHub; default 1. |
| max_nights | INT | BNHub; optional. |
| registration_number | VARCHAR(100) | Short-term rental registration (region-specific). |
| reviewed_at | TIMESTAMPTZ | When last approved for go-live. |
| rejection_reason | TEXT | If status was rejected. |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| deleted_at | TIMESTAMPTZ | |

### listing_media

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| listing_id | UUID FK → listings NOT NULL | |
| url | VARCHAR(2048) NOT NULL | Object storage URL. |
| type | ENUM | photo. |
| sort_order | INT | Display order. |
| created_at | TIMESTAMPTZ NOT NULL | |

### listing_amenities

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| listing_id | UUID FK → listings NOT NULL | |
| amenity_key | VARCHAR(100) NOT NULL | e.g. wifi, parking. |
| UNIQUE(listing_id, amenity_key) | | |

### listing_availability

Per-date availability for BNHub. When a booking is confirmed, dates are marked booked.

| Column | Type | Description |
|--------|------|-------------|
| listing_id | UUID FK → listings NOT NULL | |
| date | DATE NOT NULL | |
| status | ENUM NOT NULL | available, blocked, booked. |
| booking_id | UUID FK → bookings | If booked. |
| UNIQUE(listing_id, date) | | |

---

## 4. BNHub booking tables

### bookings

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| listing_id | UUID FK → listings NOT NULL | |
| guest_id | UUID FK → users NOT NULL | |
| host_id | UUID FK → users NOT NULL | Denormalized for quick access. |
| check_in | DATE NOT NULL | |
| check_out | DATE NOT NULL | |
| guests | INT NOT NULL | |
| status | ENUM NOT NULL | reserved, confirmed, cancelled, completed. |
| total_cents | INT NOT NULL | Total charged to guest. |
| currency | VARCHAR(3) NOT NULL | |
| nightly_total_cents | INT | |
| cleaning_fee_cents | INT | |
| platform_guest_fee_cents | INT | |
| platform_host_fee_cents | INT | |
| tax_cents | INT | If collected. |
| host_payout_cents | INT | After platform fee. |
| idempotency_key | VARCHAR(255) UNIQUE | Prevent duplicate booking. |
| cancelled_at | TIMESTAMPTZ | |
| cancellation_reason | VARCHAR(50) | guest, host, policy, admin. |
| completed_at | TIMESTAMPTZ | When stay ended (check_out). |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### booking_status_history (optional)

For audit trail of status changes.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| booking_id | UUID FK → bookings NOT NULL | |
| from_status | ENUM | |
| to_status | ENUM NOT NULL | |
| changed_by_user_id | UUID FK → users | |
| created_at | TIMESTAMPTZ NOT NULL | |

---

## 5. Payment and transaction tables

### payments

Charges to guest (booking payment).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| booking_id | UUID FK → bookings UNIQUE | One payment per booking (or split if needed). |
| user_id | UUID FK → users NOT NULL | Payer (guest). |
| amount_cents | INT NOT NULL | |
| currency | VARCHAR(3) NOT NULL | |
| status | ENUM NOT NULL | pending, succeeded, failed, refunded, partially_refunded. |
| provider_payment_id | VARCHAR(255) | Stripe payment_intent id or similar. |
| fee_breakdown_json | JSONB | guest_fee, host_fee, tax. |
| held_until | TIMESTAMPTZ | Escrow release date. |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### payouts

Host payouts (aggregate of one or more booking payouts).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users NOT NULL | Host. |
| amount_cents | INT NOT NULL | |
| currency | VARCHAR(3) NOT NULL | |
| status | ENUM NOT NULL | pending, paid, failed, on_hold. |
| provider_payout_id | VARCHAR(255) | |
| scheduled_at | TIMESTAMPTZ | |
| paid_at | TIMESTAMPTZ | |
| related_payment_ids | UUID[] | Or separate payout_items table. |
| hold_reason | VARCHAR(100) | If on_hold (e.g. fraud_review). |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### refunds

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| payment_id | UUID FK → payments NOT NULL | |
| amount_cents | INT NOT NULL | Full or partial. |
| currency | VARCHAR(3) NOT NULL | |
| status | ENUM NOT NULL | pending, succeeded, failed. |
| provider_refund_id | VARCHAR(255) | |
| reason | VARCHAR(100) | cancellation, dispute, admin. |
| idempotency_key | VARCHAR(255) UNIQUE | |
| created_at | TIMESTAMPTZ NOT NULL | |

### payment_methods

Stored payment method per user (tokenized; no raw card).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users NOT NULL | |
| provider_customer_id | VARCHAR(255) | |
| provider_payment_method_id | VARCHAR(255) | |
| last4 | VARCHAR(4) | Optional display. |
| brand | VARCHAR(20) | card brand. |
| is_default | BOOLEAN | Default for user. |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

## 6. Messaging tables

### threads

One thread per booking (guest–host) or per deal/support case.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| type | ENUM NOT NULL | booking, deal, support. |
| booking_id | UUID FK → bookings | If type = booking. |
| deal_id | UUID FK → deals | If type = deal. |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### thread_participants

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| thread_id | UUID FK → threads NOT NULL | |
| user_id | UUID FK → users NOT NULL | |
| role | VARCHAR(50) | guest, host, broker, support. |
| UNIQUE(thread_id, user_id) | | |

### messages

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| thread_id | UUID FK → threads NOT NULL | |
| sender_id | UUID FK → users NOT NULL | |
| body | TEXT NOT NULL | |
| read_at | TIMESTAMPTZ | When read (or per-participant in message_reads). |
| created_at | TIMESTAMPTZ NOT NULL | |

### message_attachments (optional)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| message_id | UUID FK → messages NOT NULL | |
| url | VARCHAR(2048) NOT NULL | |
| content_type | VARCHAR(100) | |

---

## 7. Review and rating tables

### reviews

One per booking per side (guest review of host/listing; host review of guest).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| booking_id | UUID FK → bookings NOT NULL | |
| listing_id | UUID FK → listings NOT NULL | |
| reviewer_id | UUID FK → users NOT NULL | |
| reviewee_id | UUID FK → users NOT NULL | |
| role | ENUM NOT NULL | guest_review, host_review. |
| rating | SMALLINT NOT NULL | 1–5. |
| comment | TEXT | |
| status | ENUM NOT NULL | pending, published, removed. |
| moderation_notes | TEXT | If removed. |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| UNIQUE(booking_id, role) | | |

### listing_aggregates (or compute on read)

Cached aggregate for listing card and detail.

| Column | Type | Description |
|--------|------|-------------|
| listing_id | UUID PK FK → listings | |
| average_rating | DECIMAL(3,2) | |
| review_count | INT NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### review_reports (optional)

User-reported review for moderation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| review_id | UUID FK → reviews NOT NULL | |
| reporter_id | UUID FK → users NOT NULL | |
| reason | VARCHAR(100) | |
| status | ENUM | open, dismissed, removed. |
| created_at | TIMESTAMPTZ NOT NULL | |

---

## 8. Broker CRM tables

### contacts (broker clients)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| broker_id | UUID FK → users NOT NULL | |
| name | VARCHAR(255) NOT NULL | |
| email | VARCHAR(255) | |
| phone | VARCHAR(50) | |
| source | VARCHAR(100) | |
| notes | TEXT | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### leads

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| broker_id | UUID FK → users NOT NULL | |
| listing_id | UUID FK → listings | |
| contact_id | UUID FK → contacts | |
| name | VARCHAR(255) | |
| email | VARCHAR(255) NOT NULL | |
| phone | VARCHAR(50) | |
| message | TEXT | |
| source | ENUM | marketplace_form, bnhub_contact, manual. |
| status | ENUM NOT NULL | new, contacted, qualified, lost, won. |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

Listings with `broker_id` set are “broker listings”; broker dashboard queries listings where broker_id = current user.

---

## 9. Owner dashboard tables

Owner data is largely derived: listings where user_id = owner, bookings from those listings, payouts for that user. Optional materialized or cached tables:

### owner_portfolio_snapshots (optional)

Periodic snapshot for dashboard performance.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users NOT NULL | |
| period_start | DATE NOT NULL | |
| period_end | DATE NOT NULL | |
| total_revenue_cents | INT | |
| booking_count | INT | |
| occupancy_rate | DECIMAL(5,2) | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### maintenance_requests (optional)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| listing_id | UUID FK → listings NOT NULL | |
| user_id | UUID FK → users NOT NULL | Requester. |
| type | VARCHAR(50) | cleaning, repair. |
| description | TEXT | |
| status | ENUM | open, in_progress, completed. |
| scheduled_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

## 10. Deal marketplace tables

### deals

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| owner_id | UUID FK → users NOT NULL | Creator (broker or investor). |
| title | VARCHAR(500) NOT NULL | |
| description | TEXT | |
| type | ENUM | off_market, partnership, development. |
| location | VARCHAR(255) | |
| price_or_terms | TEXT | Free-form or structured. |
| visibility | ENUM NOT NULL | public, invite_only. |
| status | ENUM NOT NULL | draft, published, closed. |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### deal_interests

Expression of interest from investor.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| deal_id | UUID FK → deals NOT NULL | |
| user_id | UUID FK → users | If logged in. |
| email | VARCHAR(255) NOT NULL | |
| name | VARCHAR(255) | |
| message | TEXT | |
| created_at | TIMESTAMPTZ NOT NULL | |

### deal_views (optional analytics)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| deal_id | UUID FK → deals NOT NULL | |
| user_id | UUID FK → users | Null if anonymous. |
| created_at | TIMESTAMPTZ NOT NULL | |

---

## 11. Investment analytics tables

Analytics are often computed from transactional data or stored in a warehouse. The following support product-facing APIs and caching.

### market_data (aggregates by region)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| region_key | VARCHAR(100) NOT NULL | city or region. |
| period_type | ENUM | day, week, month. |
| period_start | DATE NOT NULL | |
| avg_nightly_cents | INT | |
| occupancy_rate | DECIMAL(5,2) | |
| booking_count | INT | |
| listing_count | INT | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### property_valuations (cached estimates)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| listing_id | UUID FK → listings NOT NULL | |
| estimated_value_cents | INT | |
| valuation_type | VARCHAR(50) | comparable, model. |
| model_version | VARCHAR(50) | |
| computed_at | TIMESTAMPTZ NOT NULL | |

### portfolio_metrics (per user/portfolio)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users NOT NULL | |
| period_start | DATE NOT NULL | |
| period_end | DATE NOT NULL | |
| total_revenue_cents | INT | |
| occupancy_rate | DECIMAL(5,2) | |
| avg_rate_cents | INT | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

## 12. Trust & Safety tables

### incidents

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| reporter_id | UUID FK → users NOT NULL | |
| reported_user_id | UUID FK → users | |
| reported_listing_id | UUID FK → listings | |
| booking_id | UUID FK → bookings | |
| type | ENUM NOT NULL | safety, fraud, policy, payment, other. |
| description | TEXT | |
| status | ENUM NOT NULL | open, in_progress, resolved. |
| priority | ENUM | low, medium, high, urgent. |
| assignee_id | UUID FK → users | Admin. |
| resolution_notes | TEXT | |
| resolved_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### disputes

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| booking_id | UUID FK → bookings | |
| payment_id | UUID FK → payments | |
| claimant_id | UUID FK → users NOT NULL | |
| type | ENUM | refund, conduct. |
| description | TEXT | |
| status | ENUM NOT NULL | open, in_progress, resolved. |
| resolution | ENUM | refund_full, refund_partial, no_refund. |
| resolution_amount_cents | INT | |
| resolver_id | UUID FK → users | |
| resolved_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

### fraud_signals / risk_scores

Stored output of fraud or risk engine for audit and display.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| entity_type | ENUM | user, booking, listing. |
| entity_id | UUID NOT NULL | |
| score | INT | 0–100. |
| flags | VARCHAR(50)[] | reason codes. |
| model_version | VARCHAR(50) | |
| created_at | TIMESTAMPTZ NOT NULL | |

### account_flags (optional)

Manual or rule-based flags for admin attention.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users NOT NULL | |
| flag_type | VARCHAR(50) | |
| reason | TEXT | |
| created_by_id | UUID FK → users | |
| created_at | TIMESTAMPTZ NOT NULL | |

Suspensions are stored on `users.suspended_at` and `users.suspension_reason` (see §2).

---

## 13. AI Control Center data

### risk_scores

(Can be same as fraud_signals or separate table per engine.)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users NOT NULL | |
| role | ENUM | host, guest. |
| score | INT NOT NULL | |
| components_json | JSONB | Breakdown. |
| updated_at | TIMESTAMPTZ NOT NULL | |

### pricing_recommendations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| listing_id | UUID FK → listings NOT NULL | |
| recommended_nightly_cents | INT | |
| range_low_cents | INT | |
| range_high_cents | INT | |
| model_version | VARCHAR(50) | |
| computed_at | TIMESTAMPTZ NOT NULL | |

### demand_forecasts

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| region_key | VARCHAR(100) NOT NULL | |
| period_start | DATE NOT NULL | |
| period_end | DATE NOT NULL | |
| demand_index | DECIMAL(10,4) | |
| model_version | VARCHAR(50) | |
| computed_at | TIMESTAMPTZ NOT NULL | |

### moderation_queue (or use incidents with type = content)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| entity_type | ENUM | listing, review, message. |
| entity_id | UUID NOT NULL | |
| status | ENUM | pending, approved, removed. |
| reason_code | VARCHAR(50) | |
| reviewed_by_id | UUID FK → users | |
| reviewed_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ NOT NULL | |

---

## 14. Admin governance tables

### audit_logs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| actor_id | UUID FK → users | Who performed action. |
| actor_type | VARCHAR(20) | user, system, admin. |
| action | VARCHAR(100) NOT NULL | e.g. user.suspend, listing.approve. |
| resource_type | VARCHAR(50) | user, listing, booking. |
| resource_id | UUID | |
| old_values_json | JSONB | Snapshot before (optional). |
| new_values_json | JSONB | Snapshot after (optional). |
| ip_address | INET | |
| created_at | TIMESTAMPTZ NOT NULL | |

### admin_actions

Explicit admin-only actions for compliance.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| admin_id | UUID FK → users NOT NULL | |
| action | VARCHAR(100) NOT NULL | |
| resource_type | VARCHAR(50) | |
| resource_id | UUID | |
| reason | TEXT | |
| created_at | TIMESTAMPTZ NOT NULL | |

### system_settings

Key-value for feature flags and config.

| Column | Type | Description |
|--------|------|-------------|
| key | VARCHAR(100) PK | |
| value_json | JSONB | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

## 15. Notification tables

### notifications

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users NOT NULL | |
| type | VARCHAR(50) NOT NULL | booking_confirmed, new_message, payout_sent. |
| channel | ENUM NOT NULL | email, push, in_app. |
| payload_json | JSONB | Title, body, deep_link. |
| read_at | TIMESTAMPTZ | |
| sent_at | TIMESTAMPTZ | When actually sent (email/push). |
| created_at | TIMESTAMPTZ NOT NULL | |

### notification_preferences

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| user_id | UUID FK → users NOT NULL | |
| channel | ENUM NOT NULL | email, push, in_app. |
| type | VARCHAR(50) NOT NULL | Or category. |
| enabled | BOOLEAN NOT NULL | |
| UNIQUE(user_id, channel, type) | | |

### delivery_logs (optional)

For debugging email/push delivery.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| notification_id | UUID FK → notifications NOT NULL | |
| channel | ENUM NOT NULL | |
| provider_id | VARCHAR(255) | External id. |
| status | VARCHAR(50) | delivered, failed. |
| created_at | TIMESTAMPTZ NOT NULL | |

---

## 16. System metadata tables

### feature_flags

| Column | Type | Description |
|--------|------|-------------|
| key | VARCHAR(100) PK | |
| enabled | BOOLEAN NOT NULL | |
| rollout_percent | INT | 0–100. |
| updated_at | TIMESTAMPTZ NOT NULL | |

### platform_metrics (snapshots)

Daily or hourly aggregates for admin dashboard.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | |
| metric_key | VARCHAR(100) NOT NULL | active_users, bookings_count, gmv_cents. |
| period_start | TIMESTAMPTZ NOT NULL | |
| period_end | TIMESTAMPTZ NOT NULL | |
| value | DECIMAL(20,4) | |
| dimensions_json | JSONB | e.g. region. |
| created_at | TIMESTAMPTZ NOT NULL | |

### schema_migrations

Standard migrations table (e.g. Flyway, Prisma migrations).

| Column | Type | Description |
|--------|------|-------------|
| version | VARCHAR(50) PK | |
| applied_at | TIMESTAMPTZ NOT NULL | |

---

## 17. Database relationships

### Entity relationship summary

| From | To | Relationship | FK |
|------|-----|--------------|-----|
| users | user_roles | 1:N | user_roles.user_id |
| users | user_profiles | 1:1 | user_profiles.user_id |
| users | listings | 1:N (owner) | listings.user_id |
| users | listings | 1:N (broker) | listings.broker_id |
| users | bookings | 1:N (guest) | bookings.guest_id |
| users | bookings | 1:N (host) | bookings.host_id |
| users | payments | 1:N | payments.user_id |
| users | payouts | 1:N | payouts.user_id |
| users | reviews | 1:N (reviewer) | reviews.reviewer_id |
| users | contacts | 1:N | contacts.broker_id |
| users | leads | 1:N | leads.broker_id |
| users | deals | 1:N | deals.owner_id |
| users | incidents | 1:N (reporter) | incidents.reporter_id |
| users | incidents | 1:N (reported) | incidents.reported_user_id |
| users | notifications | 1:N | notifications.user_id |
| listings | listing_media | 1:N | listing_media.listing_id |
| listings | listing_amenities | 1:N | listing_amenities.listing_id |
| listings | listing_availability | 1:N | listing_availability.listing_id |
| listings | bookings | 1:N | bookings.listing_id |
| listings | reviews | 1:N | reviews.listing_id |
| listings | leads | 1:N | leads.listing_id |
| bookings | payments | 1:1 | payments.booking_id |
| bookings | reviews | 1:2 (guest + host) | reviews.booking_id |
| bookings | threads | 1:1 | threads.booking_id |
| threads | thread_participants | 1:N | thread_participants.thread_id |
| threads | messages | 1:N | messages.thread_id |
| deals | deal_interests | 1:N | deal_interests.deal_id |
| payments | refunds | 1:N | refunds.payment_id |
| users | payment_methods | 1:N | payment_methods.user_id |

### Foreign key rules

- **ON DELETE:** For strong ownership (e.g. listing_media → listings), use CASCADE so that deleting a listing removes media. For references that must not delete the parent (e.g. payments → bookings), use RESTRICT or NO ACTION so that booking cannot be deleted while payment exists. For soft delete, use deleted_at and do not cascade.
- **Nullable FKs:** Use NULL when the relationship is optional (e.g. incident may or may not have a booking_id). Use NOT NULL when the relationship is required (e.g. every booking has a listing_id).

---

## 18. Indexing strategy

### High-query paths

| Table | Index | Purpose |
|-------|--------|---------|
| users | (email) UNIQUE | Login lookup. |
| users | (verification_status), (suspended_at) | Verification and suspension filters. |
| listings | (user_id), (status), (type) | Dashboard and admin. |
| listings | (city, region, country, status) | Search filter by location. |
| listings | (status) WHERE status = 'live' | Public search. |
| listing_availability | (listing_id, date) UNIQUE | Availability check and booking. |
| bookings | (guest_id), (listing_id), (status), (check_in) | My trips, host calendar, reporting. |
| payments | (booking_id) UNIQUE | Booking → payment. |
| payments | (user_id), (created_at) | Transaction history. |
| payouts | (user_id), (status), (scheduled_at) | Host payout list. |
| threads | (booking_id) | Thread by booking. |
| messages | (thread_id, created_at) | Message list. |
| reviews | (listing_id), (reviewer_id), (booking_id) | Listing reviews, uniqueness. |
| incidents | (status), (priority), (created_at) | Admin queue. |
| notifications | (user_id, read_at), (created_at) | In-app list. |
| audit_logs | (actor_id), (resource_type, resource_id), (created_at) | Audit queries. |

### Geographic indexing

- **Listings:** (latitude, longitude) for geo-distance queries. Use GiST or BRIN in PostgreSQL for spatial queries; or rely on search engine (Elasticsearch geo) for search and keep DB for transactional reads.
- **Search:** Primary search is via search index (Elasticsearch/OpenSearch); DB indexes support admin and dashboard only.

### Composite indexes

- (listing_id, date) on listing_availability for availability check.
- (user_id, role) on user_roles for role check.
- (thread_id, created_at) on messages for ordered message list.

---

## 19. Data security measures

### Encryption

- **At rest:** Enable TDE or volume encryption for database and backups. Encrypt PII columns (e.g. phone, payout details) with application-level encryption if required by policy; keys in KMS or vault.
- **In transit:** TLS for all client–DB and app–DB connections.

### Sensitive data handling

- **password_hash:** Never logged or returned in API. Only auth service reads it.
- **provider_payment_id, provider_customer_id:** Stored for reconciliation; not exposed to frontend except last4/brand where needed.
- **PII:** Access only by services that need it (auth, user, payment, support). Analytics and AI use anonymized or aggregated data; no raw PII in warehouse without governance.

### Access control

- **Application:** Single DB user per service (or per app) with least privilege (e.g. read/write only to required tables). No shared root.
- **Admin:** Admin actions go through application layer; audit_logs and admin_actions record who did what. Direct DB access is for ops and DBA only; logged.

### Audit logging

- **Scope:** All admin actions (suspend, approve listing, resolve dispute, refund override). Sensible auth events (login success/fail). Payment and payout state changes.
- **Retention:** Retain per compliance and legal requirement (e.g. 7 years for financial). Archive or cold storage for old audit logs.

### Data retention

- **Soft delete:** users.deleted_at, listings.deleted_at; retain for recovery and compliance window, then anonymize or purge per policy.
- **Bookings and payments:** Retain for legal and tax; do not delete. Anonymize guest/host in exports for analytics after retention period if needed.
- **Logs and notifications:** Retain per product and policy; purge or archive after period.

---

## 20. Scalability strategy

### Read replicas

- **Use:** All read-heavy queries (search result hydration, dashboard lists, analytics reads) can use read replica(s). Writes (booking create, payment, payout) go to primary.
- **Replication lag:** Accept eventual consistency for non-critical reads (e.g. dashboard counts). Critical path (booking confirmation, payment success) reads from primary.

### Partitioning

- **Time-based:** For very large tables (e.g. audit_logs, notifications), partition by created_at (month or quarter). Enables efficient purge and archive.
- **Entity-based:** Optional partition by region or tenant if multi-tenant by region; otherwise single schema with region in columns.

### Analytics and AI

- **Transactional DB:** Source of truth for OLTP. No heavy analytical queries on primary; move to warehouse via ETL or event stream.
- **Data warehouse:** Replicate or stream users, listings, bookings, payments (anonymized/aggregated as needed) for reporting and AI training. No direct write from app to warehouse.
- **AI feature store:** Store feature vectors and model outputs; read by inference service. Write from training or batch jobs; not from transaction path except risk_scores and pricing_recommendations written after async job.

### Caching

- **Sessions and hot data:** Redis (or equivalent) for session, rate limit, and hot listing/profile cache. Invalidate on update.
- **Search:** Served from search index; DB used for detail and consistency. No cache of full search result set required if search engine is fast.

### Connection and capacity

- **Pooling:** Use connection pooling (PgBouncer or app-level) to limit connections to DB. Scale app instances horizontally; DB connections scale with pool size per instance.
- **Monitoring:** Track connection count, replication lag, slow queries, and table sizes. Set alerts for capacity and performance.

---

## Reference

| Topic | Document |
|-------|----------|
| Data entities and flows | [LECIPM-PLATFORM-ARCHITECTURE](LECIPM-PLATFORM-ARCHITECTURE.md) |
| Product behavior and entities | [LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT](LECIPM-PRODUCT-REQUIREMENTS-DOCUMENT.md) |
| Implementation tasks | [LECIPM-ENGINEERING-TASK-MAP](LECIPM-ENGINEERING-TASK-MAP.md) |
| Current Prisma schema | [apps/web/prisma/schema.prisma](apps/web/prisma/schema.prisma) |

---

*This document is the Database Schema Blueprint for the LECIPM platform. Implement in PostgreSQL (or compatible) with migrations; align existing [Prisma schema](apps/web/prisma/schema.prisma) over time with this blueprint.*
