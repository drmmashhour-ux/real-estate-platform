/**
 * First raise execution playbook — $100k–$500k pre-seed/seed. No performance promises; use real metrics only in updates.
 */
export const FUNDRAISING_EXECUTION = {
  targetAmountMinCad: 100_000,
  targetAmountMaxCad: 500_000,
  /** Default round target when `FUNDRAISING_TARGET_CAD` is unset (middle of range). */
  defaultTargetCad: 250_000,
  roundLabel: "pre-seed / seed bridge",
  materials: {
    pitchDeck: "1-pager + full deck: problem, Québec wedge, product, GTM, team, use of funds, risks.",
    demo: "5-minute live walkthrough: broker prioritization + LECI guide + pipeline (test/staging).",
    keyMetrics: "Real signals only: active brokers, revenue (if any), growth snapshots from internal metrics — label sources.",
    roadmap: "Next 6–12 months: milestones, hiring, product — no unverifiable ARR/GMV claims.",
  },
  outreach: {
    investorListSizeMin: 20,
    investorListSizeMax: 40,
    batchPerWeekMin: 5,
    batchPerWeekMax: 10,
    note: "Batch outreach: personalize first line; one clear ask (15-min intro).",
  },
  meeting: {
    pitchMinutes: 5,
    afterPitch: "Q&A and next-step agreement (date for diligence or pass).",
  },
  followUp: {
    daysAfterTouchMin: 3,
    daysAfterTouchMax: 5,
    defaultDays: 4,
    shareUpdatePrompt: "Short traction note: what shipped, 1 metric, 1 ask.",
  },
  softCommitments: {
    note: "Use commitment rows: `verbal` / `interested` = non-binding; `partial` = amount scoped pending docs; `committed` = signed path.",
  },
  closing: {
    /** Real closing pressure only: enough interest to finalize docs — no fake deadlines. */
    whenToAccelerate:
      "When aggregate of verbal + partial + hard commitments (per your model) covers the remaining gap to target — state the simple math in writing to investors.",
  },
  postClose: {
    sendUpdate: "First investor email: what closed, use of funds, reporting cadence, contact owner.",
    onboardInvestors: "Data room / updates list / optional quarterly call — as agreed in docs.",
  },
} as const;

export type FundraisingExecutionConfig = typeof FUNDRAISING_EXECUTION;
