# Insurance & Trust Intelligence System

The LECIPM Trust Intelligence System upgrades traditional insurance tracking into a real-time trust signal that drives marketplace ranking, risk governance, and proactive compliance.

## 1. Strict Coverage Validation

Professional liability insurance is now validated against multiple real-time factors:
- **Status**: Must be `ACTIVE`.
- **Term**: Current date must fall between `startDate` and `endDate`.
- **Threshold**: Minimum coverage of **$1,000,000** per loss is required for the "Insured" badge.

Implementation: `isBrokerInsuranceValid(brokerId)` in `insurance.service.ts`.

## 2. Trust Score Computation

We compute a blended **Trust Score (0.0 to 1.0)** for every broker, which informs listing ranking:

- **40% Insurance Status**: Active, valid coverage provides the primary trust baseline.
- **30% Compliance Score**: Derived from historical compliance events and adherence to platform rules.
- **30% Risk Heuristics**: Analyzes transaction density, dual-agency frequency, and claim history.

Implementation: `computeBrokerTrustScore(brokerId)` in `trust-score.service.ts`.

## 3. Claim Impact & Risk Engine

Insurance claims are now a primary input for risk scoring.
- **Single Claim**: Moderate penalty to risk score.
- **Multiple Claims (Last 12mo)**: Severe penalty, potentially flagging the broker for manual review and removing the "Insured" badge if risk exceeds safety thresholds.

Implementation: `evaluateBrokerInsuranceRisk` in `insurance-risk.engine.ts`.

## 4. Proactive Alert System

The system monitors insurance health and triggers real-time notifications via `insurance-alert.service.ts`:

- **Expiring Soon**: Notifies broker and admin 30 days before policy end date.
- **Expired**: Immediate notification when coverage lapses; removes marketplace badges.
- **New Claim**: Alerts compliance team for immediate review.
- **High Risk**: Triggers administrative review when trust scores drop below critical levels.

## 5. Marketplace Impact

### Ranking Boost
Insured brokers with high trust scores receive a ranking multiplier in BNHub and CRM search results.

### Search Filters
Guests can filter for **"Insured Brokers Only"** to ensure they are dealing with verified, protected professionals.

### Badge Upgrade
The simple "Insured" badge has been upgraded to show:
- Verified coverage level (e.g., "$2M liability coverage").
- Pulse warning for policies near expiry.

## 6. Admin Monitoring

The Compliance Command Center features a dedicated **Insurance & Trust Intelligence** panel showing:
- Policies requiring renewal.
- Brokers with escalating risk profiles.
- Recent claim intake queue.
