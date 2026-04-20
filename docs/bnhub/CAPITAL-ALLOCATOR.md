# BNHub AI Capital Allocator (deterministic portfolio budget engine)

**Product labels:** AI Capital Allocator · deterministic portfolio budget recommendation engine · **not** fiduciary advice, **not** guaranteed returns or alpha.

Capital is allocated from a **fixed total budget** across BNHub listings using **internal operating metrics only** (booking-derived KPIs, investment recommendation rows, autonomy outcomes, pricing rule weights, optional budget-need fields on `ShortTermListing`).  
It does **not** invent comparables or external market facts.

## Separation of concerns

1. **Inputs** — `loadAllocationMetricsForPortfolio` (`capital-metrics-loader.service.ts`): `ShortTermListing` + `getListingRevenueMetrics`, `InvestmentRecommendation`, `AutonomyOutcome`, `AutonomyRuleWeight`.
2. **Scoring** — `buildAllocationCandidate` (`capital-priority-score.service.ts`): priority, impact, confidence, allocation type, suggested dollar ceiling.
3. **Constraints** — manual capital lock (`manualCapitalLock`), sell/reduce stance, proportional cap vs recommended amount.
4. **Allocation** — `allocateBudgetAcrossCandidates` (`capital-budget-engine.service.ts`): reserve %, proportional split by composite weight.
5. **Rationale** — string array per listing + persisted `metricsJson` / `rationaleJson`.

## Persistence

Prisma: `CapitalAllocationPlan`, `CapitalAllocationItem`, `CapitalAllocationLog` (`capital_allocation_*` tables).

## APIs

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/capital-allocator/plans` | Scoped to signed-in host unless admin |
| POST | `/api/capital-allocator/plans` | `{ scopeType, scopeId, totalBudget, reservePct?, periodLabel?, notes? }` |
| POST | `/api/capital-allocator/plans/[id]/approve` | Owner or admin |
| POST | `/api/capital-allocator/plans/[id]/apply` | Status bookkeeping only — does not move money |
| POST | `/api/capital-allocator/plans/[id]/rebalance` | `{ additionalBudget }` — distributes by priority |

## Dashboard

Primary UI: `/[locale]/[country]/dashboard/investor/capital-allocator`  
Shortcut: `/dashboard/investor/capital-allocator` → redirects to default locale/country.

## Acceptance checklist

1. Metrics load from BNHub listings owned by `scopeId` (host user id).
2. Each listing yields one deterministic `AllocationCandidate`.
3. Reserve % reduces allocatable pool correctly.
4. Only eligible rows (non-reduce, positive recommended ceiling) receive proportional dollars.
5. Sell/reduce listings get zero allocation from the pool.
6. Growth / optimize / operations / pricing types follow rules in `buildAllocationCandidate`.
7. Plans and items persist; logs on generate / approve / apply / rebalance.
8. Approve then apply updates statuses (informational until payment integration).
9. Rebalance adds budget by priority weights.
10. Dashboard shows latest summary for `scopeType` + `scopeId`.
11. Copy avoids guaranteed-return language (see dashboard disclaimer).
12. Revenue KPIs remain sourced from BNHub booking math + stored snapshots/recommendations.

## Validation

```bash
cd apps/web && pnpm exec vitest run modules/capital-allocator/capital-allocator.test.ts
pnpm exec prisma validate --schema=./prisma/schema.prisma
```
