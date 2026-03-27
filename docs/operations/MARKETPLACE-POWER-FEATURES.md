# Marketplace Power Features – Cross-Module Integration

This document describes how the 7 critical marketplace features integrate with existing LECIPM modules and how data flows between them.

## 1. Listing Verification System

- **Listings**: New listings get `submittedForVerificationAt` and `verificationStatus: PENDING`. Verification steps (host identity, address, photo, ownership) are logged in `ListingVerificationLog`.
- **Trust & Safety**: Admin moderation queue (`/admin/moderation`) approves or rejects; rejection reason is stored and shown to host. Verified listings show badge on listing detail and in search.
- **Data flow**: Create listing → listing enters queue → admin reviews → approve/reject → badge and `verifiedAt` updated. Verification logs provide audit trail.

## 2. Dynamic Pricing Engine

- **Listings**: Uses `nightPriceCents`, `city` for market comparison. `PricingRule` and `PricingRecommendation` store rules and history per listing.
- **Bookings**: Optional `checkIn`/`checkOut` used for date-based rules (seasonality, events).
- **Host dashboard**: Pricing widget calls `GET /api/bnhub/pricing?listingId=...` and displays recommended price, market avg, demand level. Host can set pricing rules via `POST /api/bnhub/pricing/rules`.
- **Analytics**: Stored `PricingRecommendation` rows support historical analysis.

## 3. Smart Search Ranking

- **Search**: `searchListings` with `sort=recommended` uses `getRankingWeights()` and `computeListingRankScore()` (verification, Super Host, host quality, review score, review count, conversion).
- **Listings**: Include `owner.hostQuality` and reviews for scoring.
- **Admin**: `SearchRankingConfig` table and `/admin/ranking` allow configuring weights. `GET/POST /api/bnhub/ranking` read/update weights.

## 4. Fraud Detection System

- **Signals**: `createFraudSignal(entityType, entityId, signalType, score)` can be called from:
  - Listing creation (e.g. new listing → optional FAKE_LISTING check)
  - Booking creation (SUSPICIOUS_BOOKING)
  - Payment events (PAYMENT_FRAUD, REFUND_ABUSE)
  - Reviews (REVIEW_MANIPULATION)
  - Messaging (SUSPICIOUS_MESSAGING)
- **Alerts**: `getOrCreateFraudAlert(signalIds)` aggregates signals above threshold into `FraudAlert`. Admin queue at `/admin/fraud` and `GET/PATCH /api/bnhub/fraud/alerts`.
- **Trust & Safety**: Alerts can be forwarded to trust-safety service for suspension or investigation; web-app holds the queue and status.

## 5. Dispute Resolution Center

- **Bookings**: Disputes link to `bookingId` and `listingId`. Guest/host open dispute from booking page → `POST /api/bnhub/disputes`.
- **Evidence**: `DisputeEvidence` and `evidenceUrls` on Dispute; `addDisputeEvidence` for uploads. Message thread via `DisputeMessage` and `GET/POST /api/bnhub/disputes/[id]/messages`.
- **Payments**: Resolution may trigger refund (handled by payment service when integrated).
- **Admin/Support**: `/admin/disputes` lists disputes; support can add internal messages (`isInternal: true`) and update status.

## 6. Host Quality Score

- **Reviews**: On each new review, `computeAndUpsertHostQuality(ownerId)` is called (in `createReview`). Score from avg rating, cancellation rate; Super Host when score ≥ 4.8, ≥ 3 reviews, cancellation ≤ 1%.
- **Bookings**: Cancellation rate comes from booking status. Response time would come from messaging (not yet wired).
- **Host quality history**: Each update appends to `HostQualityHistory` for trends and audit.
- **Listings & Search**: Listing detail shows Super Host badge and quality score; search ranking uses `hostQuality` in score.

## 7. Supply Growth Engine

- **Referrals**: `ReferralProgram` defines reward amounts. `createReferral(referrerId)` uses default program; `useReferralCode(code, usedByUserId)` marks referral used. Host dashboard shows “Invite hosts” and referral code.
- **Supply metrics**: `recordSupplyGrowthMetric(date, newListings, newHosts, referralSignups, ...)` intended for daily cron. `getSupplyGrowthMetrics(days)` powers `/admin/supply-growth` and acquisition dashboard.
- **Broker/PM onboarding**: Placeholder flows can call same referral or dedicated onboarding APIs; acquisition tracking uses same metrics.

## Security, Audit, and Governance

- **Verification**: All approve/reject and step logs in `ListingVerificationLog` with `createdBy` (admin id).
- **Disputes**: Status changes and resolution store `resolvedBy`, `resolvedAt`; message thread and evidence are immutable for audit.
- **Fraud**: Alert status updates support `resolvedBy` and `notes`; signal metadata stores entity references for traceability.
- **Ranking**: Config changes are in `SearchRankingConfig`; admin-only in production (add auth to POST /api/bnhub/ranking).
- **Host quality**: History table gives full score timeline; no PII in score itself.

## API Summary

| Feature        | GET | POST | PATCH |
|----------------|-----|------|-------|
| Moderation     | /api/bnhub/moderation | - | - |
| Approve/Reject | - | .../moderation/[id]/approve, .../reject | - |
| Pricing        | /api/bnhub/pricing?listingId= | - | - |
| Pricing rules  | /api/bnhub/pricing/rules?listingId= | .../pricing/rules | - |
| Ranking        | /api/bnhub/ranking | .../ranking | - |
| Fraud alerts   | /api/bnhub/fraud/alerts | - | .../fraud/alerts/[id] |
| Fraud signal   | - | (internal/createFraudSignal) | - |
| Disputes       | /api/bnhub/disputes | .../disputes | - |
| Dispute update | - | - | .../disputes/[id] |
| Dispute msgs   | .../disputes/[id]/messages | .../disputes/[id]/messages | - |
| Supply growth  | /api/bnhub/supply-growth | .../supply-growth | - |
| Referral       | /api/bnhub/referral?referrerId= | .../referral, .../referral/use | - |
