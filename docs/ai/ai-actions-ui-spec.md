# AI actions UI spec

Defines **surfaces** where AI/automation outputs appear, interaction patterns, and **approval boundaries**. Implementation targets: `apps/web/app/[locale]/[country]/(dashboard)/dashboard/admin/automation/*` plus hub-specific panels named below.

---

## Cross-cutting UX rules

1. **Explainability** — every card shows “Why” with reason codes / signal summary.
2. **Primary CTA discipline** — destructive or customer-visible actions use secondary style until approved.
3. **Hub context** — never show BNHub-only controls on residential CRM routes and vice versa without scope switcher.
4. **Mobile** — summaries first; drill-down on desktop where possible.

---

## 1. Admin Automation Center

**Route (implemented):** `/[locale]/[country]/dashboard/admin/automation`

**Purpose**

- Single operator entry for automation health, trigger inventory (read-only v1), links to BNHub autonomy/counterfactual docs where relevant.

**Sections**

- Overview: stage banner (Stage 1 recommendations-only).
- Links: Recommendations Center, Autopilot Modes (policy text), Trigger definitions, Approval Queue placeholder.
- Embedded: Admin Daily AI Summary preview (deterministic KPI lines).

**Approval**

- No destructive controls on this page in v1.

---

## 2. AI Recommendations Center

**Route:** `/dashboard/admin/automation/recommendations`

**Purpose**

- Browse latest machine/heuristic bundles: listing quality, leads priority preview (admin lens), investor summary excerpt.

**Interactions**

- Deep links into native admin tools (listings, leads, investor tools).

---

## 3. Seller AI suggestions panel (hub)

**Placement:** Seller listing wizard / listing health sidebar (future wiring).

**Content**

- Listing Quality Agent checklist; drafts collapsed behind “Review” modal.

**Approval**

- Publish listing changes → explicit confirm.

---

## 4. Broker AI pipeline assistant

**Placement:** Broker dashboard pipeline or leads table enhancement.

**Content**

- Ranked leads with urgency chips; draft reply opens composer prefilled — **send requires click**.

---

## 5. Investor AI opportunity panel

**Placement:** Investor portal recommendations area (existing routes extended).

**Content**

- Ranked opportunities + deterministic summary; disclaimers as per compliance.

---

## 6. Host optimization panel (BNHub)

**Placement:** Host dashboard “Insights” strip.

**Content**

- Revenue suggestions bundle; autonomy status chip when configured.

**Approval**

- Night-rate apply only via existing pricing/autonomy flows.

---

## 7. Mobile AI summaries

**Pattern**

- Push/in-app: digest notifications opt-in; deep link to full rationale on web.

**Constraints**

- Short body; no misleading ROI claims; reference internal metrics only.

---

## Approval Queue (future wiring)

**Route:** `/dashboard/admin/automation/approvals`

**Purpose**

- Holds AI-generated **draft actions** awaiting reviewer (Stage 2+).

**v1**

- Explainer + empty state; aligns with governance notification architecture when queue backend is unified.

---

## References

- [ai-automation-master-plan.md](./ai-automation-master-plan.md)
- [GUARDRAILS.md](./GUARDRAILS.md)
