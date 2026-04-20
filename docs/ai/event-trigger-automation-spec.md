# Event-trigger automation spec

Defines **events**, **sources**, **AI analysis** (interpreted as: scoring / summarization / routing — not hidden inference), **outputs**, **notification targets**, and **approval rules**. Implementation hooks live in `apps/web/modules/automation/automation-events.service.ts` (registry) and `automation-router.service.ts` (dispatch).

All handlers must be **no-throw** at the module boundary and log structured outcomes.

---

## Trigger catalog

### 1. New listing (CRM or BNHub draft → published)

| Field | Specification |
|-------|----------------|
| **Event source** | `Listing` / `ShortTermListing` create or status transition webhook path; internal Prisma middleware optional. |
| **AI analysis** | Completeness score; mandatory field gaps; BNHub photo count vs minimum. |
| **Output** | Quality checklist recommendation; SEO draft optional (Stage 2). |
| **Notification target** | Seller/host dashboard; broker if co-listed. |
| **Approval rule** | No auto-publish; visibility follows listing visibility rules. |

---

### 2. Low completion listing

| Field | Specification |
|-------|----------------|
| **Event source** | Scheduled job comparing completion schema vs thresholds. |
| **AI analysis** | Weighted missing fields; trust/safety sensitive fields prioritized. |
| **Output** | Prioritized suggestion list (`listing-quality-suggestions.service.ts`). |
| **Notification target** | Seller AI suggestions panel; broker rollup if B2B. |
| **Approval rule** | User accepts each change; bulk apply behind feature flag only. |

---

### 3. High search demand (listing)

| Field | Specification |
|-------|----------------|
| **Event source** | Internal search analytics tables when populated. |
| **AI analysis** | Spike detection vs trailing baseline (deterministic). |
| **Output** | “Demand up” insight + pricing suggestion pointer (**not auto price**). |
| **Notification target** | Host optimization panel; admin trend feed. |
| **Approval rule** | Pricing still host/autonomy policy. |

---

### 4. Booking confirmed (BNHub)

| Field | Specification |
|-------|----------------|
| **Event source** | `Booking` status transition to confirmed/paid path. |
| **AI analysis** | Revenue contribution; occupancy forecast delta (internal). |
| **Output** | Host digest line item; optional upsell suggestions (draft). |
| **Notification target** | Host inbox / notifications center. |
| **Approval rule** | Guest-facing messages draft-only until sent. |

---

### 5. Payout anomaly

| Field | Specification |
|-------|----------------|
| **Event source** | Payout reconciliation jobs; Stripe events. |
| **AI analysis** | Deviation vs expected schedule/amount thresholds. |
| **Output** | Risk Review Agent ticket suggestion + admin summary. |
| **Notification target** | Finance/admin queue; host informational when safe. |
| **Approval rule** | No automatic chargebacks; follow payments playbook. |

---

### 6. Lead purchased / high-intent lead

| Field | Specification |
|-------|----------------|
| **Event source** | CRM lead ingest; marketplace purchase events when applicable. |
| **AI analysis** | Merge existing `Lead.score`; recency; tier. |
| **Output** | Rank boost + suggested next step (draft message). |
| **Notification target** | Broker AI pipeline assistant. |
| **Approval rule** | Outbound requires human send (v1). |

---

### 7. High-value investor signal

| Field | Specification |
|-------|----------------|
| **Event source** | `InvestmentRecommendation` updates; portfolio KPI crosses threshold. |
| **AI analysis** | Rank opportunities; change summary (deterministic ordering). |
| **Output** | Investor opportunity summary (**informational**). |
| **Notification target** | Investor portal panel; optional email digest opt-in. |
| **Approval rule** | No trading execution; disclosures as required by jurisdiction. |

---

### 8. Low occupancy (BNHub)

| Field | Specification |
|-------|----------------|
| **Event source** | Revenue dashboard signals / autonomy signals aggregator. |
| **AI analysis** | Trend vs threshold windows (internal only). |
| **Output** | Host revenue suggestion bundle; pointer to autonomy **review** if enabled. |
| **Notification target** | Host optimization panel. |
| **Approval rule** | Align with BNHub autonomy policy (`AUTONOMY.md`). |

---

### 9. New user signup

| Field | Specification |
|-------|----------------|
| **Event source** | Auth registration completion. |
| **AI analysis** | Segment classification (rules); cohort tagging proposal. |
| **Output** | Welcome checklist; broker/host onboarding suggestions. |
| **Notification target** | In-app onboarding modals; optional email sequences (marketing approval). |
| **Approval rule** | Marketing automation behind template approval. |

---

### 10. Conversion drop (funnel)

| Field | Specification |
|-------|----------------|
| **Event source** | Analytics pipeline; admin KPI time series. |
| **AI analysis** | Step-down attribution (heuristic); anomaly flag. |
| **Output** | Admin daily summary bullet; drill-down links. |
| **Notification target** | Admin Automation Center + growth stakeholders. |
| **Approval rule** | No automatic experiments without `AutonomyExperiment` / growth governance. |

---

## Notification alignment

Reuse existing notification infrastructure (channels, preferences, audit). New automation must **emit structured logs** (`meta.reasonCodes`) compatible with operator search.

---

## References

- [ai-actions-ui-spec.md](./ai-actions-ui-spec.md)
- [OPERATIONS.md](./OPERATIONS.md)
