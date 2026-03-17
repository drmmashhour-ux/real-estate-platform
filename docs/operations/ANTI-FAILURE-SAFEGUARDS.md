# Anti-Failure Architecture Safeguards

This document describes the three safeguard layers and how they integrate with core LECIPM workflows.

## 1. Operational Control Layer

**Purpose:** Centralized control over risky flows without code redeploy. All actions are audited.

**Components:**
- **FeatureFlag** – Key-based toggles (e.g. `instant_booking`) with optional scope (GLOBAL / REGION).
- **OperationalControl** – Typed controls: KILL_SWITCH, PAYOUT_HOLD, LISTING_FREEZE, BOOKING_RESTRICTION, MODERATION_LEVEL, REGIONAL_LOCK. Each has targetType (GLOBAL, REGION, USER, LISTING_CATEGORY) and optional targetId.
- **ControlActionAuditLog** – Every flag/control change is logged with action, performedBy, reasonCode, previous/new value.

**APIs:**
- `GET/POST /api/admin/feature-flags` – List and set flags.
- `GET /api/admin/feature-flags/check?key=...&region=...` – Check if feature is enabled (used by services).
- `GET/POST /api/admin/controls` – List and create/update controls.
- `GET /api/admin/controls/audit` – Audit log.

**Integration:**
- **Bookings:** Before creating a booking, `isBookingRestrictedFor({ listingId, region })` is checked. If true, API returns 403.
- **Payouts:** Before releasing payout, call `isPayoutHeldFor({ userId, region })` (integrate in payout service or pay endpoint).
- **Listings:** Before making a listing visible or creating one, call `isListingFrozenFor({ userId, region, category })` (integrate in listing create/search).

**Admin UI:** `/admin/controls` – Feature flags toggle, active controls list, audit log.

---

## 2. Observability and Platform Health Layer

**Purpose:** Detect issues early via metrics, events, alerts, and incidents.

**Components:**
- **ServiceHealthMetric** – Time-series metrics (serviceName, metricName, value, unit, region). Record from cron or health endpoints.
- **SystemAlert** – Alerts with type, severity (INFO/WARNING/CRITICAL), message, threshold, currentValue. Resolved when resolvedAt is set.
- **PlatformEvent** – Structured events (eventType, entityType, entityId, payload, region) for funnel and debugging.
- **OperationalIncident** – Open/incident response tracking (title, severity, status, startedAt, resolvedAt).

**APIs:**
- `GET /api/admin/health` – Snapshot (bookings, payments, disputes, fraud signals in last 24h) + active alerts + open incidents + latest metrics.
- `GET/POST /api/admin/health/events` – List and record platform events.
- `GET/POST /api/admin/health/alerts` – List and create alerts.
- `POST /api/admin/health/alerts/[id]/resolve` – Resolve alert.
- `POST /api/admin/health/metrics` – Record a health metric (for cron).

**Integration:**
- **Booking created:** `recordPlatformEvent({ eventType: "booking_created", entityType: "BOOKING", entityId, payload, region })` in bookings API.
- **Payment completed/failed:** Record event and optionally increment failure metric; threshold can create alert.
- **Fraud signal / dispute created:** Record event; aggregate volumes can drive alerts (e.g. fraud spike).
- **Services:** Each service can POST to `/api/admin/health/metrics` with latency, error count, etc.

**Admin UI:** `/admin/health` – Health snapshot cards, active alerts (with resolve), open incidents.

---

## 3. Policy Engine and Rules Enforcement Layer

**Purpose:** Consistent, configurable business rules with traceable decisions.

**Components:**
- **PolicyRule** – key, name, ruleType (ELIGIBILITY, VISIBILITY, RELEASE_CONDITION, VERIFICATION, AUTO_BLOCK, CANCELLATION, REVIEW_ELIGIBILITY, REFERRAL_REWARD), scope (GLOBAL/REGION), conditions (JSON), effect (ALLOW/DENY/HOLD/REQUIRE_ACTION), effectPayload.
- **PolicyDecisionLog** – Every evaluation is logged (ruleKey, entityType, entityId, decision, reasonCode, context).

**Default rules (seeded by ensureDefaultPolicies):**
- `payout_release_identity` – HOLD if verification &lt; VERIFIED.
- `payout_release_fraud` – HOLD if fraud score &gt; 0.6.
- `booking_confirm_fraud` – DENY if fraud score &gt; 0.8.
- `review_eligibility_completed_stay` – DENY if booking not COMPLETED.
- `listing_live_min_info` – DENY if hasMinInfo not true.
- `listing_live_verification` – ALLOW (placeholder).

**APIs:**
- `GET/POST /api/admin/policies` – List and upsert rules.
- `GET /api/admin/policies/decisions` – Decision log (audit).
- `POST /api/admin/policies/evaluate` – Evaluate rule(s) with context (for testing).

**Integration:**
- **Bookings:** Before creating booking, `canConfirmBooking({ bookingId, listingId, fraudScore, region })` is called. If !decision.allowed, return 403 with reasonCode.
- **Payouts:** Before release, `canReleasePayout({ userId, bookingId, fraudScore, verificationStatus })`. If HOLD, do not release and store reason.
- **Reviews:** `canLeaveReview({ bookingId, bookingStatus })` – already enforced in createReview; can add explicit policy check for consistency.
- **Listings:** `canListGoLive({ listingId, verificationStatus, hasMinInfo })` – use in listing create or visibility pipeline.

**Admin UI:** `/admin/policies` – List rules, view decision log.

---

## Cross-System Integration Summary

| System           | Operational control        | Observability              | Policy engine                |
|-----------------|----------------------------|----------------------------|-----------------------------|
| Auth            | -                          | -                          | -                           |
| Users           | PAYOUT_HOLD, LISTING_FREEZE per user | Events by userId           | Eligibility rules           |
| Listings        | LISTING_FREEZE, REGION     | listing_created event      | canListGoLive               |
| Search          | -                          | -                          | Visibility rules            |
| Bookings        | BOOKING_RESTRICTION        | booking_created event      | canConfirmBooking           |
| Payments        | PAYOUT_HOLD                | payment_completed/failed    | canReleasePayout            |
| Messaging       | -                          | message_delivery (optional)| -                           |
| Reviews         | -                          | -                          | canLeaveReview              |
| Disputes        | -                          | dispute_created event       | -                           |
| Fraud           | -                          | fraud_signal event, alerts | maxFraudScore in rules      |
| Host quality    | -                          | -                          | -                           |
| Referrals       | -                          | -                          | referral reward rules       |
| Admin           | All controls UI, audit     | Health UI, alerts, incidents | Policy UI, decision log  |

---

## Security and Governance

- **Admin-only:** All `/api/admin/*` routes should be protected by role (admin/superadmin). Add auth middleware and RBAC checks in production.
- **Step-up:** For emergency controls (e.g. global kill switch), require a second factor or approval in production.
- **Audit:** Control actions and policy decisions are logged; retain for compliance.
- **Reversibility:** Feature flags and controls can be toggled off; policy rules can be updated. Alerts and incidents can be resolved.

---

## Testing

- **Feature flags:** Unit test `isFeatureEnabled` with mock DB or integration test with seed data.
- **Policy engine:** Unit tests for `evaluateRule` and `evaluatePolicies` with fixed rules and context (see lib/policy-engine tests).
- **Operational controls:** Integration test that creating a BOOKING_RESTRICTION for a region returns 403 for booking in that region.
- **Health:** Unit test that `getPlatformHealthSnapshot` aggregates counts; test alert create/resolve.
