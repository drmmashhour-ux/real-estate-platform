import type { DrBrainMetrics } from "@/lib/drbrain/metrics";
import type { DrBrainExplanation } from "@/lib/drbrain/explanations";
import type { PredictiveSignal } from "@/lib/drbrain/predictive";
import type { DrBrainReport, DrBrainTicket } from "@repo/drbrain";

/** Pure UI demo tickets — never persisted while investor demo mode is active. */
export const DEMO_DRBRAIN_TICKETS: DrBrainTicket[] = [
  {
    id: "demo-drbrain-ticket-a",
    appId: "syria",
    appEnv: "staging",
    severity: "WARNING",
    category: "PAYMENTS",
    title: "[Demo] Elevated blocked payment ratio",
    description: "Synthetic ticket — investor narrative only.",
    recommendedActions: ["Review SYBNB audit counters", "Confirm fraud thresholds"],
    status: "OPEN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { demo: true },
  },
  {
    id: "demo-drbrain-ticket-b",
    appId: "syria",
    appEnv: "staging",
    severity: "CRITICAL",
    category: "DATABASE",
    title: "[Demo] Connection latency spike",
    description: "Synthetic CRITICAL ticket — no database incident.",
    recommendedActions: ["Check provider status page", "Verify migrations"],
    status: "ACKNOWLEDGED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { demo: true },
  },
];

const HOUR_MS = 60 * 60 * 1000;

/** Synthetic DR.BRAIN report — no DB side effects (investor demo only). */
export function buildSyriaInvestorDemoReport(): DrBrainReport {
  const ts = new Date().toISOString();
  return {
    appId: "syria",
    appEnv: "staging",
    status: "OK",
    timestamp: ts,
    recommendations: ["Demo narrative only — enable production checks before any payment activation."],
    results: [
      {
        appId: "syria",
        check: "demo.mode",
        level: "INFO",
        ok: true,
        message: "DRBRAIN_INVESTOR_DEMO_MODE — simulated dashboard only.",
      },
    ],
    ticketsEmitted: [],
  };
}

/** Metrics arrays without querying Postgres — deterministic seeded curves. */
export function buildSyriaInvestorDemoMetrics(): DrBrainMetrics {
  const endHour = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
  const timestamps: string[] = [];
  const paymentAttempts: number[] = [];
  const blockedPayments: number[] = [];
  const anomalyScores: number[] = [];
  const errorRate: number[] = [];

  for (let i = 23; i >= 0; i--) {
    const t = endHour - i * HOUR_MS;
    timestamps.push(new Date(t).toISOString());
    const wave = Math.sin(i / 4) * 4 + 12;
    paymentAttempts.push(Math.max(0, Math.round(wave + i * 0.15)));
    blockedPayments.push(Math.max(0, Math.round(3 + (i % 5))));
    anomalyScores.push(Math.min(100, Math.round(28 + Math.cos(i / 3) * 12)));
    errorRate.push(Math.min(100, Math.round(4 + Math.sin(i / 5) * 3)));
  }

  return {
    paymentAttempts,
    blockedPayments,
    payouts: { held: 42, eligible: 18, released: 310, blocked: 7 },
    anomalyScores,
    errorRate,
    timestamps,
  };
}

export function buildSyriaInvestorDemoExplanation(): DrBrainExplanation {
  return {
    summary: "Investor demo narrative — rule-based explanations attach to production DR.BRAIN runs only.",
    causes: ["Synthetic signals only — no live Syria marketplace queries."],
    impact: "None — presentation overlay.",
    recommendedActions: ["Run production dashboard without DRBRAIN_INVESTOR_DEMO_MODE before operational decisions."],
  };
}

export function buildSyriaInvestorDemoPredictive(): PredictiveSignal[] {
  return [{ level: "WARNING", message: "Simulated signal — elevated anomaly slope (demo only)." }];
}

/** KPI cards — investor slides (strings only). */
export const DRBRAIN_INVESTOR_DEMO_KPIS = {
  platformHealthPct: "99.98%",
  issuesDetected: 12,
  autoProtectedIncidents: 3,
  paymentAnomaliesBlocked: 24,
  fraudAttemptsPrevented: 18,
  avgResponseMs: 142,
} as const;
