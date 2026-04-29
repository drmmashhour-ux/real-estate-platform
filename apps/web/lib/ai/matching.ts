/**
 * Buyer ↔ project fit scoring (heuristic, no ML).
 */

export type BuyerProfileInput = {
  userId?: string;
  cityPreference?: string | null;
  maxBudget?: number | null;
  investmentGoal?: string | null;
};

export type ProjectMatchInput = {
  id: string;
  city: string;
  status: string;
  startingPrice: number;
  featured?: boolean | null;
  deliveryDate?: Date | string | null;
  name?: string | null;
};

export type UnitMatchInput = { id: string; type: string; price: number; size: number; status: string };

export type BuyerMatch = {
  projectId: string;
  matchScore: number;
  reasons: string[];
  recommendedUnitId: string | null;
};

function normCity(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function parseDeliveryYears(d: ProjectMatchInput["deliveryDate"]): number | null {
  if (d == null) return null;
  const t = d instanceof Date ? d.getTime() : Date.parse(String(d));
  if (!Number.isFinite(t)) return null;
  const years = (t - Date.now()) / (1000 * 60 * 60 * 24 * 365);
  return years;
}

export function matchBuyerToProjects(
  profile: BuyerProfileInput,
  projects: ProjectMatchInput[],
  unitsByProjectId: Record<string, UnitMatchInput[]>
): BuyerMatch[] {
  const budget = profile.maxBudget != null && profile.maxBudget > 0 ? profile.maxBudget : null;
  const pref = normCity(profile.cityPreference);
  const goal = (profile.investmentGoal ?? "").toLowerCase();

  const rows: BuyerMatch[] = [];

  for (const p of projects) {
    const units = unitsByProjectId[p.id] ?? [];
    const affordable = budget == null ? units : units.filter((u) => u.price <= budget * 1.05);
    const pool = affordable.length > 0 ? affordable : units;
    const best =
      pool.length > 0
        ? pool.reduce((a, b) => (a.price <= b.price ? a : b))
        : null;

    let score = 52;
    const reasons: string[] = [];

    if (pref && normCity(p.city) === pref) {
      score += 18;
      reasons.push(`City matches preference (${p.city})`);
    } else if (pref) {
      reasons.push(`City: ${p.city}`);
    }

    if (budget != null && best) {
      const headroom = 1 - best.price / budget;
      if (headroom >= 0.05) {
        score += 14;
        reasons.push("Listed units sit comfortably under your budget");
      } else if (headroom >= 0) {
        score += 6;
        reasons.push("Nearest unit is within budget");
      } else {
        score -= 12;
        reasons.push("Starting price may exceed budget — verify incentives and phase pricing");
      }
    }

    if (p.featured) {
      score += 4;
      reasons.push("Highlighted inventory");
    }

    const yrs = parseDeliveryYears(p.deliveryDate);
    if (yrs != null) {
      if (goal.includes("income") || goal.includes("rent")) {
        if (yrs < 1.5) {
          score += 6;
          reasons.push("Near-term delivery aligns with rental income goals");
        }
      } else if (goal.includes("appreciation")) {
        score += yrs > 1 ? 8 : 3;
        reasons.push("Delivery horizon supports staged appreciation assumptions (illustrative)");
      }
    }

    const st = (p.status ?? "").toLowerCase();
    if (st.includes("sold") || st.includes("closed")) score -= 20;

    score = Math.round(Math.min(100, Math.max(0, score)));
    rows.push({
      projectId: p.id,
      matchScore: score,
      reasons: reasons.length > 0 ? reasons : [`Project ${p.name ?? p.id} — heuristic fit`],
      recommendedUnitId: best?.id ?? null,
    });
  }

  return rows.sort((a, b) => b.matchScore - a.matchScore);
}
