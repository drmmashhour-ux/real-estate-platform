/**
 * LECIPM field scaling — types + sample rows for the admin dashboard.
 * Replace with Prisma/CRM when you wire real telemetry.
 */

export type FieldAgentRole = "field_agent" | "team_lead" | "ops_control";

export type FieldAgentRow = {
  id: string;
  displayName: string;
  code: string;
  role: FieldAgentRole;
  /** Demos completed (rolling / MTD as you define). */
  demosDone: number;
  /** 0–1, trial or next-step conversion as defined by ops. */
  conversionRate: number;
  /** Minutes, stopwatch to end of slot. */
  avgDemoTimeMinutes: number;
  /** Heuristic: repeated coach flags or self-report. */
  scriptDeviationFlags: number;
  /** If true, surface in review queue. */
  lowPerformance: boolean;
};

export const SCALING_PHASES = [
  {
    id: "p1",
    title: "Phase 1 — 2 agents",
    bullets: ["Tester le script au réel", "Affiner le message et les preuves"],
  },
  {
    id: "p2",
    title: "Phase 2 — 3 à 5 agents",
    bullets: ["Suivre la performance (démos, taux, durée)", "Garder les meilleurs profils en priorité sur les bons comptes"],
  },
  {
    id: "p3",
    title: "Phase 3 — 5 à 10 agents",
    bullets: ["Script standardisé, formation courte", "Retirer ou recadrer les profils bas"],
  },
] as const;

export const TEAM_ROLES_BLURB: { role: string; who: string }[] = [
  { role: "Field Agent", who: "Exécute le script, démo ≤10 min, pousse l’essai sur dossier." },
  { role: "Team Lead", who: "Meilleur exécutant : coach quotidien, relecture des écarts de script." },
  { role: "Toi (contrôle final)", who: "Arbitrage, priorisation territoire, règles de qualité et sorties bas-perf." },
];

const MOCK: FieldAgentRow[] = [
  {
    id: "a1",
    displayName: "Maya R.",
    code: "FLD-01",
    role: "team_lead",
    demosDone: 34,
    conversionRate: 0.22,
    avgDemoTimeMinutes: 8.4,
    scriptDeviationFlags: 0,
    lowPerformance: false,
  },
  {
    id: "a2",
    displayName: "Alex T.",
    code: "FLD-02",
    role: "field_agent",
    demosDone: 18,
    conversionRate: 0.19,
    avgDemoTimeMinutes: 9.1,
    scriptDeviationFlags: 1,
    lowPerformance: false,
  },
  {
    id: "a3",
    displayName: "Sam K.",
    code: "FLD-03",
    role: "field_agent",
    demosDone: 9,
    conversionRate: 0.08,
    avgDemoTimeMinutes: 11.2,
    scriptDeviationFlags: 3,
    lowPerformance: true,
  },
];

export function getFieldAgentLeaderboard(): FieldAgentRow[] {
  return [...MOCK].sort(
    (a, b) => b.conversionRate * 100 + b.demosDone * 0.1 - (a.conversionRate * 100 + a.demosDone * 0.1),
  );
}

export function getFieldAgentKpis(rows: FieldAgentRow[]) {
  const n = rows.length;
  if (!n) {
    return {
      totalDemos: 0,
      avgConversion: 0,
      avgDemoMinutes: 0,
      needReview: 0,
    };
  }
  const totalDemos = rows.reduce((s, r) => s + r.demosDone, 0);
  const avgConversion = rows.reduce((s, r) => s + r.conversionRate, 0) / n;
  const avgDemoMinutes = rows.reduce((s, r) => s + r.avgDemoTimeMinutes, 0) / n;
  const needReview = rows.filter((r) => r.lowPerformance || r.scriptDeviationFlags >= 2).length;
  return { totalDemos, avgConversion, avgDemoMinutes, needReview };
}
