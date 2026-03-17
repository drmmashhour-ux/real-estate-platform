# Platform Defense Layer

The Platform Defense Layer makes LECIPM legally protected, operationally defensible, abuse-resistant, and resilient under disputes, fraud, and regulatory pressure.

## 1. Legal Defense and Liability Shield

**Purpose:** Evidence-ready records of who accepted what terms, when, which version, which market.

**Components:**
- **PolicyAcceptanceRecord** – userId, policyKey, policyVersion, acceptedAt, marketId, entityType/entityId (for booking/payout/listing context), ipAddress, userAgent, metadata.
- **LegalEventLog** – eventType (TERMS_ACCEPTED, DISCLOSURE_SHOWN, ACKNOWLEDGEMENT, POLICY_CHANGE, JURISDICTION_BINDING), userId, entityType/entityId, marketId, payload, reasonCode.
- **recordPolicyAcceptance** – Creates record and a TERMS_ACCEPTED legal event.
- **hasAcceptedPolicy** – Check if user has accepted a policy (optional version/market filter).
- **getAcceptanceRecordsForUser** / **getLegalEventLog** – For compliance review.

**Integration:** Call `recordPolicyAcceptance` when user accepts booking terms (e.g. before or at booking creation). Call `hasAcceptedPolicy` before checkout if you require prior acceptance. Use **POST /api/defense/acceptance** (current user) or **POST /api/admin/defense/legal/acceptance** (admin) to record.

**APIs:**
- `POST /api/defense/acceptance` – Record acceptance for current user (body: policyKey, policyVersion, marketId, entityType, entityId).
- `POST /api/admin/defense/legal/acceptance` – Admin record any user.
- `GET /api/admin/defense/legal/events` – Legal event log (eventType, userId, entityType, entityId, from, limit).

---

## 2. Evidence Preservation and Case Integrity

**Purpose:** Secure evidence storage, chain-of-custody, access logging, case timeline.

**Components:**
- **EvidenceRecord** – caseType (DISPUTE, FRAUD, INCIDENT, COMPLIANCE, LEGAL), caseId, classification (PHOTO, DOCUMENT, etc.), url, uploadedBy, retentionUntil, checksum.
- **EvidenceAccessLog** – evidenceId, accessedBy, accessType (VIEW, EXPORT, DOWNLOAD), reasonCode.
- **createEvidenceRecord** – Register an evidence item.
- **logEvidenceAccess** – Log every access for traceability.
- **getEvidenceForCase** / **getCaseTimeline** – List evidence and timeline for a case.

**APIs:**
- `GET /api/admin/defense/evidence?caseType=&caseId=&timeline=` – Get evidence list or timeline.
- `POST /api/admin/defense/evidence` – Create evidence record (caseType, caseId, classification, url, uploadedBy, etc.).

---

## 3. Abuse Prevention and Adversarial Behavior

**Purpose:** Repeat offenders, linked accounts, abuse signals, graduated enforcement.

**Components:**
- **AbuseSignal** – userId, entityType/entityId, signalType (enum: REPEAT_OFFENDER, LINKED_ACCOUNT, EVASION_AFTER_SUSPENSION, ABUSIVE_MESSAGING, ABUSIVE_BOOKING, REFUND_ABUSE, PROMOTION_ABUSE, REFERRAL_ABUSE, BAN_EVASION), severity, payload, createdBy.
- **OffenderProfile** – userId (unique), strikeCount, lastStrikeAt, suspendedAt, bannedAt, linkedAccountIds, notes.
- **recordAbuseSignal** – Creates signal; upserts offender profile and optionally increments strike.
- **getOffenderProfile** / **getAbuseSignals** – Query by user or entity.
- **isUserRestricted** – Returns { suspended, banned } for use in booking/auth.

**Integration:** Booking POST checks `isUserRestricted(guestId)` and returns 403 if banned or suspended. Enforcement actions (suspension, ban) update OffenderProfile and create OperationalControls.

**APIs:**
- `GET /api/admin/defense/abuse?userId=&profile=true` – Get profile for user.
- `GET /api/admin/defense/abuse` – List signals (userId, entityType, entityId, signalType, limit).
- `POST /api/admin/defense/abuse` – Record abuse signal (userId, entityType, entityId, signalType, severity, payload, createdBy).

---

## 4. Internal Access Defense

**Purpose:** Privileged action logging, approval requests, dual-control for critical actions.

**Components:**
- **PrivilegedAdminAction** – adminId, actionType (PAYOUT_RELEASE, SUSPENSION, BAN, IMPERSONATION, EVIDENCE_ACCESS, LEGAL_EXPORT), entityType/entityId, reasonCode, reasonText, approvalId.
- **ApprovalRequest** – requestType, requestedBy, targetType/targetId, status (PENDING, APPROVED, REJECTED), reviewedBy, reviewedAt, reviewNotes.
- **logPrivilegedAction** – Log every sensitive admin action.
- **createApprovalRequest** / **reviewApprovalRequest** – Create and approve/reject.
- **getPendingApprovals** / **getPrivilegedActions** – For audit and approval UI.

**APIs:**
- `GET/POST /api/admin/defense/privileged` – List actions (adminId, actionType, from) or log action.
- `GET /api/admin/defense/approvals` – Pending approvals.
- `POST /api/admin/defense/approvals` – Create request or review (body: id, decision, reviewedBy, reviewNotes or requestType, requestedBy, …).

---

## 5. Crisis Response and Emergency Defense

**Purpose:** Emergency incidents, regional freezes, action log, playbook integration.

**Components:**
- **CrisisEvent** – title, severity (LOW, MEDIUM, HIGH, CRITICAL), status (ACTIVE, CONTAINED, RESOLVED), region, startedAt, resolvedAt, playbookRef, summary.
- **CrisisActionLog** – crisisId, actionType (BOOKING_FREEZE, PAYOUT_FREEZE, CONTENT_TAKEDOWN, ESCALATION), targetType/targetId, performedBy, reasonCode, payload.
- **createCrisisEvent** / **resolveCrisisEvent** – Create and resolve crisis.
- **logCrisisAction** – Log each emergency action.
- **applyEmergencyBookingFreeze** / **applyEmergencyPayoutFreeze** – Create OperationalControl (BOOKING_RESTRICTION / PAYOUT_HOLD) for region and log crisis action.

**APIs:**
- `GET /api/admin/defense/crisis` – Active crisis events; `?crisisId=` for timeline.
- `POST /api/admin/defense/crisis` – action: create | resolve | log_action | booking_freeze | payout_freeze (with required fields per action).

---

## 6. Regulatory Compliance Defense

**Purpose:** Market-specific compliance requirements, compliance reviews, queues.

**Components:**
- **ComplianceRequirement** – marketId, requirementKey, name, description, active.
- **ComplianceReview** – entityType, entityId, marketId, status (PENDING, COMPLIANT, NON_COMPLIANT, EXCEPTION), reviewedBy, documentRefs.
- **upsertComplianceRequirement** / **getComplianceRequirements** – Per market.
- **upsertComplianceReview** / **getComplianceReviewQueue** – Per entity and queue.

**APIs:**
- `GET /api/admin/defense/compliance?marketId=` – Requirements for market; `?queue=true` for review queue.
- `POST /api/admin/defense/compliance` – Upsert requirement (marketId, requirementKey, name, …) or review (entityType, entityId, status, …).

---

## 7. Financial Defense

**Purpose:** Payout risk flags, refund/chargeback defense, loss tracking.

**Components:**
- **FinancialRiskFlag** – entityType/entityId, flagType (SUSPICIOUS_PAYOUT, REFUND_ABUSE, CHARGEBACK_RISK, ANOMALY), severity, status (OPEN, UNDER_REVIEW, CLEARED, CONFIRMED), amountCents, createdBy, resolvedBy.
- **createFinancialRiskFlag** / **resolveFinancialRiskFlag** – Create and resolve.
- **getFinancialRiskFlags** / **hasOpenFinancialRisk** – For payout release checks (call before releasing payout).

**APIs:**
- `GET /api/admin/defense/financial-risk` – List flags (entityType, entityId, flagType, status, limit).
- `POST /api/admin/defense/financial-risk` – Create flag or resolve (body: resolve: true, id, status, resolvedBy).

---

## 8. Enforcement Framework

**Purpose:** Warnings, restrictions, freezes, suspensions, bans, appeals.

**Components:**
- **EnforcementAction** – userId, actionType (WARNING, TEMPORARY_RESTRICTION, LISTING_FREEZE, BOOKING_LIMITATION, PAYOUT_HOLD, ACCOUNT_SUSPENSION, PERMANENT_BAN, MARKET_SPECIFIC), severity, reasonCode, reasonText, marketId, effectiveAt, expiresAt, performedBy.
- **Appeal** – enforcementId, userId, description, status (PENDING, UNDER_REVIEW, APPROVED, REJECTED, WITHDRAWN), reviewedBy, outcomeNotes.
- **createEnforcementAction** – Creates action; for SUSPENSION/BAN/PAYOUT_HOLD/LISTING_FREEZE also creates or updates OperationalControl and OffenderProfile.
- **getEnforcementHistory** / **submitAppeal** / **reviewAppeal** / **getPendingAppeals**.

**APIs:**
- `GET /api/admin/defense/enforcement?userId=` – Enforcement history; `?appeals=true&pending=true` for pending appeals.
- `POST /api/admin/defense/enforcement` – Create action (userId, actionType, severity, reasonCode, …) or submit appeal (appeal: true, userId, description) or review appeal (reviewAppeal: true, appealId, decision, reviewedBy, outcomeNotes).

---

## 9. Defense Analytics

**Purpose:** Incident rates, dispute rates, fraud loss, abuse recurrence, appeal outcomes, compliance failures.

**Components:**
- **DefenseMetricsSnapshot** – date, marketId, incidentCount, disputeCount, disputeRate, fraudLossCents, abuseSignalsCount, suspensionCount, appealCount, appealApprovalRate, payoutHoldCount, complianceFailures, data (JSON).
- **buildDefenseMetricsSnapshot** – Aggregates from disputes, bookings, fraud signals, abuse signals, enforcement, appeals, operational controls, compliance reviews.
- **getDefenseMetricsSnapshots** – Stored snapshots with filters.

**APIs:**
- `GET /api/admin/defense/metrics?snapshot=true&date=&marketId=` – On-the-fly snapshot.
- `GET /api/admin/defense/metrics` – List stored snapshots (from, to, marketId).
- `POST /api/admin/defense/metrics` – Store snapshot (date, marketId).

---

## Cross-System Integration

| System        | Legal        | Evidence | Abuse     | Internal | Crisis   | Compliance | Financial | Enforcement |
|---------------|-------------|----------|-----------|----------|----------|------------|-----------|-------------|
| Bookings      | Acceptance  | –        | Restrict  | –        | Freeze   | –          | –         | Restrict    |
| Payouts       | Acceptance  | –        | –         | Log      | Freeze   | –          | Risk flag | Hold        |
| Disputes      | –           | Case     | Signal    | –        | –        | Review     | –         | –           |
| Policy engine | –           | –        | –         | –        | –        | –          | hasOpenFinancialRisk | –    |
| Oper. controls| –           | –        | –         | –        | Freeze   | –          | –         | Create      |
| Admin         | Events      | Evidence | Abuse API | Privileged, Approvals | Crisis API | Compliance API | Risk API | Enforcement API |

---

## Security and Governance

- **Immutable-style records:** Policy acceptances and legal events are append-only; no updates or deletes in normal flow.
- **Evidence access:** Every access (view/export/download) should be logged via **logEvidenceAccess** with reasonCode.
- **Privileged actions:** All sensitive admin actions go through **logPrivilegedAction** with reasonCode; high-risk actions should require an **ApprovalRequest** and approval before execution.
- **Crisis actions:** Every emergency action is logged in **CrisisActionLog** with performedBy and reasonCode.
- **Enforcement:** All enforcement actions create an **EnforcementAction** record and, where applicable, sync to OperationalControl and OffenderProfile.

---

## Testing

- **lib/defense/__tests__/legal-records.test.ts** – recordPolicyAcceptance (creates record + legal event), hasAcceptedPolicy.
- **lib/defense/__tests__/abuse-prevention.test.ts** – isUserRestricted (suspended, banned, none), getOffenderProfile.

Run: `npm run test -- --run` in `apps/web-app`.
