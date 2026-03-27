# First 1000 users — BNHub + LECIPM acquisition engine

Scale from **~100 → 1000** real users (hosts + guests) with **semi-automation**, **paid ads**, **content**, and **measurable funnels**. This doc ties together product surfaces, APIs, and daily execution.

**Prerequisites:** [first-100-users.md](first-100-users.md) (CRM, `/early-access`, scripts). **Admin CRM (scale):** `/admin/growth-crm` (funnel, automation, leaderboard).

---

## Growth strategy

1. **Compound channels** — No single channel wins; stack outbound + content + paid + referrals + SEO landing pages.
2. **Speed over polish** — Ship weekly creative and copy tests; keep infra simple (this repo uses deterministic templates, not mandatory LLM spend).
3. **Measure weekly** — Use CRM status as funnel stage, `source` for attribution, optional `conversionScore` + `leadTier` for prioritization (see [funnel-metrics.md](funnel-metrics.md)).
4. **Automate only what repeats** — Follow-up scheduling and tier sync from scores; humans still send DMs and close hosts.

**North-star cadence:** see *Daily execution* below.

---

## Acquisition channels

| Channel | Role at 1K scale | System hook |
|--------|-------------------|-------------|
| **Direct outreach (semi-automated)** | Volume 50–100 touches/day | `services/growth/ai-outreach.ts`, `/api/admin/growth/personalized-message`, CRM `followUpAt` |
| **Content (short video)** | Trust + retargeting audiences | `services/growth/content-engine.ts`, [content-30days.md](content-30days.md) |
| **Paid ads (Meta / TikTok)** | Predictable top-of-funnel | [ads-strategy.md](ads-strategy.md); UTM → `GrowthLeadCapture` / CRM `source` |
| **Referrals** | Lowest CAC after product–market fit | `User.referralCode`, `Referral.inviteKind` (`HOST` for host→host), [leaderboard API](#referral-system) |
| **SEO / landing** | Long-tail demand | `/early-access`, pillar pages; keep LCP tight (static sections, minimal JS) |
| **Partnerships** | Local density | Real estate + property managers; tag `source=partner` in CRM |

---

## Automation engine

| Piece | What it does |
|-------|----------------|
| **Message templates + personalization** | `services/growth/ai-outreach.ts` — `{{NAME}}`, `{{AREA}}`, `{{LINK}}` |
| **Follow-up scheduling** | `lib/growth/lead-automation.ts` — stale `CONTACTED` → sets `followUpAt` (24–48h style spacing) |
| **Lead scoring** | `conversionScore` 0–100 + `leadTier` LOW/MEDIUM/HIGH; automation can sync tier from score |
| **Admin trigger** | `POST /api/admin/growth-crm/automation` (`dryRun=1` first) |

**Reply tracking** — Still manual: move row to `REPLIED` when they answer. Future: integrate inbox webhooks if you add them.

---

## Ads system

See **[ads-strategy.md](ads-strategy.md)** for audiences, budgets, creatives, and platform notes.

**Minimum viable tracking:** tag links with `utm_source`, `utm_medium`, `utm_campaign`; map winning campaigns to CRM `source` (`meta_ads`, `tiktok_ads`). Log spend and signups in a spreadsheet or internal sheet until you add a dedicated ad metrics table.

---

## Referral system

- **User → user:** existing flow — `signup?ref=REFERRAL_CODE` (and optional JSON `ref` on register). Credits via `lib/referrals.ts`.
- **Host → host:** same link plus **`ref_kind=HOST`** (query or body) so `Referral.inviteKind` is stored — use for ops (“visibility boost” for supply recruiters) and leaderboard breakdown.
- **Leaderboard:** `GET /api/admin/referrals/leaderboard` — surfaced on `/admin/growth-crm`.

---

## Tracking + analytics

- **CRM:** `EarlyUserTracking.status` = pipeline (`CONTACTED` → `REPLIED` → `SIGNED_UP` → `ONBOARDED` = active).
- **`followUpAt`** = follow-up due date (aka “follow_up_date” in playbooks).
- **`source`** = channel (includes `meta_ads`, `tiktok_ads`, `seo`).
- **Funnel API:** `GET /api/admin/growth-crm/funnel`.

Full metric definitions: [funnel-metrics.md](funnel-metrics.md).

---

## Optimization loop

Weekly: scripts, creative, ads, UX friction. Use **[growth-optimization.md](growth-optimization.md)** as the checklist. Tie back to [growth-review.md](growth-review.md) for narrative “what worked.”

---

## Daily execution

**Targets (once channels are warm):**

| Track | Tasks |
|--------|--------|
| **Growth** | 3–5 posts (shorts + stories); ads checked; creative variants logged |
| **Sales / supply** | Host onboarding calls; 50–100 outbound touches (semi-automated copy); clear follow-up list from CRM `followUpAt` |
| **Goals** | 10–20 signups/day sustained is a strong trajectory toward 1K — adjust by market |

Split ownership in the team exactly like [daily-execution.md](daily-execution.md): one owner for content+ads, one for host pipeline.

---

## Code map

| Path | Purpose |
|------|---------|
| `apps/web/services/growth/ai-outreach.ts` | Templates, personalization, follow-up hour helpers |
| `apps/web/services/growth/content-engine.ts` | Rotating daily ideas / captions / outlines |
| `apps/web/lib/growth/lead-automation.ts` | DB rules for follow-ups + tier sync |
| `apps/web/app/api/admin/growth-crm/*` | Funnel + automation |
| `apps/web/app/api/admin/growth/personalized-message` | Admin-only JSON for copy previews |
| `apps/web/app/admin/growth-crm/page.tsx` | Funnel + tables |

**Migration:** after schema change, run:

`pnpm --filter @lecipm/web exec prisma migrate dev`

---

## Final validation checklist

- [ ] Daily outreach + content calendar owned  
- [ ] CRM updated same day (status, source, follow-up)  
- [ ] Automation dry-run reviewed before “Run rules”  
- [ ] Ads UTMs and weekly spend vs signup count reviewed  
- [ ] Referral links tested (`ref` + optional `ref_kind=HOST`)
