# AI agents & autopilot matrix

Operating matrix for **LECIPM + BNHub**. “Autopilot” here means **bounded automation eligible under hub policy** — not unconditional self-driving. Outputs are typed: recommendation, draft, approval-required action, safe auto-task (see `apps/web/modules/automation/automation.types.ts`).

Legend for **risk**: L = low, M = medium, H = high (financial, legal, or reputational exposure).

| Agent name | Target hub | Trigger | Action | Human approval? | Risk | Output type | KPI impacted |
|------------|------------|---------|--------|-------------------|------|-------------|--------------|
| Listing Quality Agent | Seller / BNHub host | Low completion score; QA flag | Field & media checklist suggestions | Yes for publish | L–M | recommendation + draft | Completion %; inquiry rate |
| Pricing Suggestion Agent | BNHub host | Occupancy/revenue bands (internal signals) | Suggested band + rationale | Yes for live rate change | M | recommendation | RevPAR; occupancy |
| Lead Prioritization Agent | Broker CRM | New lead; idle high-score lead | Ordered queue + urgency labels | No for ordering; yes for outbound send | L | recommendation | Time-to-contact; conversion |
| Host Revenue Agent | BNHub host | Revenue dip vs trailing window | Summary + non-binding tips | Yes for price/availability apply | M | recommendation | Gross revenue |
| Investor Opportunity Agent | Investor portal | New/changed `InvestmentRecommendation` | Ranked summary digest | N/A (read-only); yes if messaging | L–M | recommendation | Engagement |
| Risk Review Agent | Admin / trust | Anomaly thresholds; fraud signals | Ticket routing suggestion | Yes for enforcement | H | recommendation | MTTR; precision |
| Admin Trend Analyst | Admin ops | Scheduled; metric spike | Narrative digest + links | Yes for destructive ops | M | recommendation | Operational latency |
| Notification Summarizer | All hubs | Burst of alerts | Single digest view | Yes if bulk outreach | L | recommendation + draft | Noise reduction |
| Content Assistant | Marketing / SEO | Content gap; calendar slot | Draft copy / meta | Yes for publish | M | draft | Organic traffic |

## Agent bundles (logical groupings)

- **Growth & acquisition**: Listing Quality, Content Assistant, Notification Summarizer.
- **Revenue & liquidity**: Pricing Suggestion, Host Revenue (aligned with autonomy **suggestion** layers, not bypassing execution gates).
- **CRM velocity**: Lead Prioritization + broker playbook suggestions (drafts).
- **Investor trust**: Investor Opportunity Agent (informational only).
- **Safety & integrity**: Risk Review Agent (never auto-ban without playbook).

## Out of scope for unattended execution

- Wire transfers, refunds, legal filings, MLS/Board submissions without integration contracts.
- Mass email/SMS without template approval.
- Automated legal advice.

See [self-optimizing-platform-roadmap.md](./self-optimizing-platform-roadmap.md) for staged introduction of drafts and bounded autopilot.
