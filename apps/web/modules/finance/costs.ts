/**
 * Operational cost model — defaults + env overrides (monthly cents, CAD).
 */

import type { CostBreakdown } from "./financial-model-types";

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Default monthly operating costs (cents) — illustrative; override via env. */
const DEFAULT_MONTHLY_CENTS = {
  hosting: 125_000,
  aiApi: 85_000,
  marketing: 330_000,
  team: 1_000_000,
  legalOps: 125_000,
};

export function getMonthlyCosts(): CostBreakdown {
  const hostingCents = envInt("FINANCE_COST_HOSTING_MONTHLY_CENTS", DEFAULT_MONTHLY_CENTS.hosting);
  const aiApiCents = envInt("FINANCE_COST_AI_API_MONTHLY_CENTS", DEFAULT_MONTHLY_CENTS.aiApi);
  const marketingCents = envInt("FINANCE_COST_MARKETING_MONTHLY_CENTS", DEFAULT_MONTHLY_CENTS.marketing);
  const teamCents = envInt("FINANCE_COST_TEAM_MONTHLY_CENTS", DEFAULT_MONTHLY_CENTS.team);
  const legalOpsCents = envInt("FINANCE_COST_LEGAL_OPS_MONTHLY_CENTS", DEFAULT_MONTHLY_CENTS.legalOps);
  return {
    hostingCents,
    aiApiCents,
    marketingCents,
    teamCents,
    legalOpsCents,
    totalCents: hostingCents + aiApiCents + marketingCents + teamCents + legalOpsCents,
  };
}

export function getYearlyCosts(): CostBreakdown {
  const m = getMonthlyCosts();
  return {
    hostingCents: m.hostingCents * 12,
    aiApiCents: m.aiApiCents * 12,
    marketingCents: m.marketingCents * 12,
    teamCents: m.teamCents * 12,
    legalOpsCents: m.legalOpsCents * 12,
    totalCents: m.totalCents * 12,
  };
}
