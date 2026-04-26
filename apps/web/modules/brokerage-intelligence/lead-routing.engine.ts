import { AccountStatus, PlatformRole } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildPortfolioContextBucketForLead } from "./context.service";
import { portfolioIntelLog } from "./brokerage-intelligence-logger";
import type { LeadPortfolioSlice, LeadRoutingResult } from "./brokerage-intelligence.types";
import { getLoadMetricsSnapshot } from "./broker-load.service";

function regionMatch(leadLoc: string | null | undefined, brokerHome: string | null | undefined): number {
  if (!leadLoc || !brokerHome) return 0.35;
  const a = leadLoc.toLowerCase().replace(/\s+/g, "");
  const b = brokerHome.toLowerCase().replace(/\s+/g, "");
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.75;
  if (a.slice(0, 2) === b.slice(0, 2)) return 0.45;
  return 0.35;
}

/**
 * Suggest a broker; never auto-assigns in the DB from this function alone (callers can persist a LeadRoutingDecision).
 */
export async function recommendBrokerForLead(lead: LeadPortfolioSlice): Promise<LeadRoutingResult> {
  const contextBucket = buildPortfolioContextBucketForLead(lead);
  const rationale: string[] = [
    "Routing is a suggestion based on public broker attributes, org reputation row when present, and current load; confirm before irreversible changes.",
  ];
  const defaultOut: LeadRoutingResult = {
    recommendedBrokerId: null,
    alternatives: [],
    rationale: [...rationale, "Not enough data to select a broker safely."],
    contextBucket,
  };
  try {
    const maxAlt = 4;
    const loadMap = await getLoadMetricsSnapshot();
    let brokerIds: string[] = [];
    if (lead.workspaceId) {
      const reps = await prisma.workspaceBrokerReputation.findMany({
        where: { workspaceId: lead.workspaceId },
        orderBy: { successRate: "desc" },
        take: 40,
        select: { brokerUserId: true, successRate: true, score: true, dealsCounted: true },
      });
      brokerIds = reps.map((r) => r.brokerUserId);
    }
    if (brokerIds.length === 0) {
      const users = await prisma.user.findMany({
        where: { role: PlatformRole.BROKER, accountStatus: AccountStatus.ACTIVE },
        take: 50,
        select: { id: true, homeRegion: true, homeCity: true },
        orderBy: { createdAt: "desc" },
      });
      brokerIds = users.map((u) => u.id);
    }
    if (brokerIds.length === 0) return defaultOut;
    const users = await prisma.user.findMany({
      where: { id: { in: brokerIds } },
      select: { id: true, homeRegion: true, homeCity: true, homeCountry: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    const repsByBroker = new Map(
      (lead.workspaceId
        ? await prisma.workspaceBrokerReputation.findMany({
            where: { workspaceId: lead.workspaceId, brokerUserId: { in: brokerIds } },
            select: { brokerUserId: true, successRate: true, dealsCounted: true },
          })
        : []
      ).map((r) => [r.brokerUserId, r] as const)
    );
    const act = await Promise.all(
      brokerIds.map(async (id) => {
        const u = byId.get(id);
        if (!u) return null;
        const load = loadMap[id] ?? 0;
        const r = repsByBroker.get(id);
        const reg = regionMatch(lead.purchaseRegion ?? lead.location, u.homeRegion ?? u.homeCity);
        const perf = (r && r.dealsCounted > 0 ? r.successRate : 0.5) * 0.2 + 0.8 * (1 - Math.min(1, load / 100) * 0.85);
        const score = 0.4 * (1 - Math.min(1, load / 100)) + 0.3 * reg + 0.3 * perf;
        return {
          brokerId: id,
          score: Math.max(0, Math.min(1, score)),
          factors: [
            `load~${load.toFixed(0)}`,
            `region~${(reg * 100).toFixed(0)}%`,
            r ? `ws_success~${(r.successRate * 100).toFixed(0)}%` : "ws_success~n/a",
          ],
        };
      })
    );
    const scored = act.filter((x): x is NonNullable<typeof x> => x != null);
    if (scored.length === 0) return { ...defaultOut, rationale: [...rationale, "All candidates filtered."] };
    if (lead.introducedByBrokerId) {
      const t = lead.introducedByBrokerId;
      for (const s of scored) {
        if (s.brokerId === t) {
          s.score = Math.min(1, s.score + 0.12);
          s.factors = [...s.factors, "existing_intro_tie_plus"];
        }
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0]!;
    const alt = scored
      .slice(1, 1 + maxAlt)
      .map((s) => s.brokerId);
    const result: LeadRoutingResult = {
      recommendedBrokerId: best.brokerId,
      alternatives: alt,
      rationale: [
        ...rationale,
        "Sorted by weighted (load, region, workspace success or neutral prior).",
        "Higher score does not label people — only product routing heuristics for assignment suggestions.",
      ],
      contextBucket,
      scores: scored,
    };
    portfolioIntelLog.routing({ leadId: lead.id, pick: best.brokerId, ctx: contextBucket.slice(0, 64) });
    return result;
  } catch (e) {
    portfolioIntelLog.warn("recommendBrokerForLead", { err: e instanceof Error ? e.message : String(e) });
    return { ...defaultOut, rationale: [...rationale, "Error path; no broker selected."] };
  }
}

/**
 * Optional audit row — safe to no-op.
 */
export async function persistRoutingDecision(lead: LeadPortfolioSlice, r: LeadRoutingResult): Promise<string | null> {
  if (!r.recommendedBrokerId) return null;
  try {
    const row = await prisma.leadRoutingDecision.create({
      data: {
        leadId: lead.id,
        recommendedBrokerId: r.recommendedBrokerId,
        alternativeBrokerIds: r.alternatives,
        rationaleJson: { text: r.rationale, factors: (r.scores ?? []).slice(0, 10) },
        contextBucket: r.contextBucket,
      },
    });
    return row.id;
  } catch (e) {
    portfolioIntelLog.warn("persistRoutingDecision", { err: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
