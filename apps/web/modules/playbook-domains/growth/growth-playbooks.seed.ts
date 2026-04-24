/**
 * Minimal safe playbook definitions (import from seed scripts if desired; no DB I/O here).
 */
export const growthPlaybookSeeds = [
  {
    key: "wave11_growth_surface_awareness_v1",
    name: "Surface awareness nudge (safe)",
    domain: "GROWTH" as const,
    actionType: "surface_rank",
    description: "Ranks in-product growth surfaces; no external messaging.",
  },
  {
    key: "wave11_growth_funnel_align_v1",
    name: "Funnel stage alignment (safe)",
    domain: "GROWTH" as const,
    actionType: "funnel_nudge",
    description: "Aligns UI to funnel stage; recommend-only or safe autopilot logging.",
  },
] as const;
