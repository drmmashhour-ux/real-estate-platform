# BNHub fraud detection (LECIPM Manager)

Deterministic, audit-friendly risk scoring for BNHub short-term listings. This layer **detects and escalates**; it does **not** punish users or change listing visibility by itself.

## Signals used (real DB only)

Collected in `collectShortTermListingFraudSignals` / `fraud-signals.ts`:

| Area | Signals |
|------|---------|
| Listing | Short title/description, low photo count, duplicate title on **another** host’s listing |
| Trust | Open `BnhubFraudFlag`, open `BnhubSafetyFlag`, failed `ListingVerificationLog` rows (90d) |
| Behavior | Listing `updatedAt` after an open fraud flag exists |
| Account | `ManagerAiOverrideEvent` count for host (90d), `TrustSafetyIncident` as reporter/accused (90d) |
| Contact | Same `User.phone` on another user (when phone present) |
| Payments | `Payment` with `FAILED` for this listing’s bookings |
| Bookings | Repeat guest booking count on same listing (90d), elevated cancellations (90d) |
| Reviews | Many reviews in 7d on listing, duplicate review comment bodies on same listing |

No fabricated demand, competitor, or off-platform data.

## Risk levels and scoring

- **Score** is the sum of **weighted** signal hits, capped at **100**.
- **LOW**: score &lt; `FRAUD_SCORE_THRESHOLDS.mediumMin` (36)
- **MEDIUM**: 36–67
- **HIGH**: ≥ 68

Weights are defined in `FRAUD_WEIGHTS` in `fraud-engine.ts` (single source of truth).

## Allowed actions

- Append `AiFraudRiskLog` rows (audit trail)
- `logManagerAction` with `bnhub_fraud_risk_eval`
- `recordAiHealthEvent` (admin monitoring feed) for MEDIUM/HIGH — throttled per entity (24h) for duplicate alerts
- `ManagerAiOverrideEvent` with `scope: "bnhub_fraud_review_required"` for **HIGH** — throttled (48h) per listing
- Reduce **non-critical** host autopilot automation for affected listings (see below)

## Blocked actions (by design)

This module sets `FRAUD_NO_AUTO_ENFORCEMENT` and **never**:

- bans or suspends users
- deletes or hides listings
- issues refunds or chargebacks
- triggers legal workflows

## Autonomy / autopilot interaction

For **MEDIUM** or **HIGH** risk with an **open** `AiFraudRiskLog` in the last **14 days**, `shouldSuppressAggressiveAutopilotForListing` returns true and:

- Skips listing optimization suggestions, revenue optimizer surfacing, promotion suggestions, and dynamic pricing suggestions for that listing.

Global permissions and platform autonomy modes are unchanged; only **per-listing** automation is dampened.

**Order of operations:** On `listing_updated`, `runBnhubFraudScanForListing` runs **before** listing optimization so the same update can respect fraud state. Scheduled scans run fraud **before** revenue and pricing scans.

## Admin dashboard

`GET /api/ai/insights` (admins) includes `bnhubFraudRiskLogs7d: { medium, high }` — counts from `AiFraudRiskLog`.

## Persistence

Model: **`AiFraudRiskLog`** (`ai_fraud_risk_logs`) — `entityType`, `entityId`, `riskLevel`, `riskScore`, `reasons` (JSON array), `payload`, `status`, optional `reviewedBy` / `reviewedAt`.

Apply schema with your usual Prisma migrate / deploy flow after pulling changes.

## Tests

See `apps/web/lib/ai/fraud/__tests__/fraud-engine.test.ts`.
