# BNHub host reputation (LECIPM Manager)

## Purpose

Hosts receive an **explainable 0–100 score** and **tier** derived only from **real platform signals** (bookings, messages, reviews, checklists, disputes). The score supports trust, marketplace ranking nudges, and cautious automation — **not** automatic punishments, listing removal, or account blocks.

## Signals used

| Signal | Source |
|--------|--------|
| Completion & cancellation rates | Terminal bookings (`PENDING` / `AWAITING_HOST_APPROVAL` excluded) |
| Response rate & response time | First guest message → first host reply on booking threads |
| Guest satisfaction | Weighted average from `PropertyRatingAggregate` across the host’s listings |
| Checklist completion | `checklistDeclaredByHostAt` on **completed** stays |
| Repeat guests | Share of bookings where the guest had a prior booking with the host |
| Disputes | Count and rate vs terminal bookings |

## Scoring method

Subscores (each 0–100) are computed, then combined:

- **Reliability (weight 0.4)** — completion vs cancellations on terminal outcomes.
- **Responsiveness (0.2)** — response rate to guest threads + time-to-first-reply buckets.
- **Guest satisfaction (0.2)** — review averages when present; otherwise a **neutral band** (not a penalty for being new).
- **Consistency (0.2)** — checklist completion rate + repeat-guest share.

**Disputes** apply a **bounded subtraction** (not a separate positive weight): penalty scales with dispute rate and count, capped so a single bad period cannot dominate forever.

**Limited history** (fewer than eight terminal bookings): subscores are **partially blended toward neutral** so new hosts are not volatile.

Final score is **clamped to [0, 100]**.

## Tiers

| Range | Tier |
|-------|------|
| 80–100 | Excellent |
| 60–79 | Good |
| 40–59 | Needs improvement |
| &lt; 40 | At risk |

## How it affects the platform

1. **Persistence** — `updateHostPerformance()` writes metrics and the **same 0–100 score** to `HostPerformance` (used by badges and jobs that already relied on host score).
2. **Marketplace ranking** — Search attaches `hostReputationScore` when the owner’s `hostPerformanceMetrics.score` is loaded. `scoreListingForSearch` applies a **small multiplicative modifier** (~±3.5%). **Listings are never hidden** by this score alone.
3. **Autopilot gate** — `gateAutopilotRecommendation` scales **base confidence** down for at-risk hosts and slightly up for strong hosts (still within calibrated bounds).
4. **Decision engine** — `computeDecisionScore` multiplies the combined score by a **reputation trust factor** so automation stays more cautious when trust signals are weak.

## Fairness rules

- No fabricated reviews or demand.
- No automatic hiding of listings or user bans from this score.
- Missing reviews use **neutral** satisfaction, not a punitive default.
- Thin history uses **damping**, not a low score by default.
- Reasons and numeric breakdowns are returned for transparency (`reasons`, `components`, `signalsUsed`).

## Code locations

- Types & output: `apps/web/lib/ai/reputation/reputation-types.ts`
- Signal loading: `apps/web/lib/ai/reputation/reputation-signals.ts`
- Scoring: `apps/web/lib/ai/reputation/reputation-engine.ts`
- DB sync: `apps/web/src/modules/reviews/aggregationService.ts` (`updateHostPerformance`)
- Ranking modifier: `apps/web/lib/bnhub/ranking/listing-ranking.ts`
- Host dashboard: `apps/web/components/host/HostReputationScore.tsx`
