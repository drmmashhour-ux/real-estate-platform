import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { derivedRates } from "@/src/modules/messaging/learning/templatePerformance";

async function upsertScore(
  entityType: string,
  entityId: string,
  scoreType: string,
  scoreValue: number,
  evidenceJson?: object
) {
  await prisma.executiveEntityScore.upsert({
    where: {
      entityType_entityId_scoreType: { entityType, entityId, scoreType },
    },
    create: {
      id: randomUUID(),
      entityType,
      entityId,
      scoreType,
      scoreValue,
      evidenceJson: evidenceJson ?? undefined,
    },
    update: { scoreValue, evidenceJson: evidenceJson ?? undefined, updatedAt: new Date() },
  });
}

export async function scoreCities(): Promise<number> {
  const convs = await prisma.growthAiConversation.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
    select: { contextJson: true, outcome: true, highIntent: true },
    take: 8000,
  });
  const byCity: Record<string, { n: number; booked: number; stale: number; handoff: number; hi: number }> = {};
  for (const c of convs) {
    const city = String((c.contextJson as { city?: string } | null)?.city ?? "__unknown__").trim() || "__unknown__";
    if (!byCity[city]) byCity[city] = { n: 0, booked: 0, stale: 0, handoff: 0, hi: 0 };
    byCity[city].n++;
    if (c.outcome === "booked") byCity[city].booked++;
    if (c.outcome === "stale") byCity[city].stale++;
    if (c.outcome === "handoff") byCity[city].handoff++;
    if (c.highIntent) byCity[city].hi++;
  }
  let n = 0;
  for (const [city, v] of Object.entries(byCity)) {
    if (v.n < 5) continue;
    const convRate = v.booked / v.n;
    const staleR = v.stale / v.n;
    const handoffR = v.handoff / v.n;
    const hiVol = v.hi / v.n;
    const priority = hiVol * 4 + convRate * 10 - staleR * 6 - handoffR * 5 + Math.log1p(v.n) * 0.3;
    await upsertScore("city", city, "priority", priority, {
      volume: v.n,
      bookedRate: convRate,
      staleRate: staleR,
      handoffRate: handoffR,
      highIntentRate: hiVol,
    });
    await upsertScore("city", city, "conversion", convRate, { samples: v.n });
    n++;
  }
  return n;
}

export async function scoreListings(): Promise<number> {
  const convs = await prisma.growthAiConversation.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
    select: { contextJson: true, outcome: true, highIntent: true },
    take: 8000,
  });
  const byListing: Record<string, { n: number; booked: number; stale: number; hi: number }> = {};
  for (const c of convs) {
    const lid = String((c.contextJson as { listing_id?: string } | null)?.listing_id ?? "").trim();
    if (!lid) continue;
    if (!byListing[lid]) byListing[lid] = { n: 0, booked: 0, stale: 0, hi: 0 };
    byListing[lid].n++;
    if (c.outcome === "booked") byListing[lid].booked++;
    if (c.outcome === "stale") byListing[lid].stale++;
    if (c.highIntent) byListing[lid].hi++;
  }
  let n = 0;
  for (const [lid, v] of Object.entries(byListing)) {
    if (v.n < 3) continue;
    const score = v.hi * 2 + v.booked * 5 - v.stale * 3 + Math.log1p(v.n);
    await upsertScore("listing", lid, "priority", score, { ...v, bookedRate: v.booked / v.n });
    n++;
  }
  return n;
}

export async function scoreBrokers(): Promise<number> {
  let orch: { assignedBrokerId: string | null; assignedAt: Date | null; conversationId: string }[] = [];
  try {
    orch = await prisma.growthAiLeadOrchestration.findMany({
      where: { assignedBrokerId: { not: null } },
      select: { assignedBrokerId: true, assignedAt: true, conversationId: true },
      take: 2000,
    });
  } catch {
    return 0;
  }
  const convIds = [...new Set(orch.map((o) => o.conversationId))];
  const convs = await prisma.growthAiConversation.findMany({
    where: { id: { in: convIds } },
    select: { id: true, outcome: true, lastHumanMessageAt: true },
  });
  const cmap = new Map(convs.map((c) => [c.id, c]));
  const byBroker: Record<string, { n: number; conv: number; slow: number }> = {};
  const now = Date.now();
  for (const o of orch) {
    const bid = o.assignedBrokerId!;
    if (!byBroker[bid]) byBroker[bid] = { n: 0, conv: 0, slow: 0 };
    byBroker[bid].n++;
    const c = cmap.get(o.conversationId);
    if (c?.outcome === "booked") byBroker[bid].conv++;
    if (o.assignedAt && c?.lastHumanMessageAt) {
      const ms = c.lastHumanMessageAt.getTime() - o.assignedAt.getTime();
      if (ms > 45 * 60_000) byBroker[bid].slow++;
    } else if (o.assignedAt && now - o.assignedAt.getTime() > 45 * 60_000) {
      byBroker[bid].slow++;
    }
  }
  let n = 0;
  for (const [bid, v] of Object.entries(byBroker)) {
    if (v.n < 2) continue;
    const perf = (v.conv / v.n) * 8 - (v.slow / v.n) * 4 + Math.log1p(v.n) * 0.2;
    await upsertScore("broker", bid, "responsiveness", 1 - v.slow / v.n, v);
    await upsertScore("broker", bid, "conversion", v.conv / v.n, v);
    await upsertScore("broker", bid, "priority", perf, v);
    n++;
  }
  return n;
}

export async function scoreHosts(): Promise<number> {
  let orch: { assignedHostId: string | null; assignedAt: Date | null; conversationId: string }[] = [];
  try {
    orch = await prisma.growthAiLeadOrchestration.findMany({
      where: { assignedHostId: { not: null } },
      select: { assignedHostId: true, assignedAt: true, conversationId: true },
      take: 2000,
    });
  } catch {
    return 0;
  }
  const convIds = [...new Set(orch.map((o) => o.conversationId))];
  const convs = await prisma.growthAiConversation.findMany({
    where: { id: { in: convIds } },
    select: { id: true, outcome: true, lastHumanMessageAt: true },
  });
  const cmap = new Map(convs.map((c) => [c.id, c]));
  const byHost: Record<string, { n: number; conv: number; slow: number }> = {};
  const now = Date.now();
  for (const o of orch) {
    const hid = o.assignedHostId!;
    if (!byHost[hid]) byHost[hid] = { n: 0, conv: 0, slow: 0 };
    byHost[hid].n++;
    const c = cmap.get(o.conversationId);
    if (c?.outcome === "booked") byHost[hid].conv++;
    if (o.assignedAt && c?.lastHumanMessageAt) {
      const ms = c.lastHumanMessageAt.getTime() - o.assignedAt.getTime();
      if (ms > 45 * 60_000) byHost[hid].slow++;
    } else if (o.assignedAt && now - o.assignedAt.getTime() > 45 * 60_000) {
      byHost[hid].slow++;
    }
  }
  let n = 0;
  for (const [hid, v] of Object.entries(byHost)) {
    if (v.n < 2) continue;
    const perf = (v.conv / v.n) * 8 - (v.slow / v.n) * 4;
    await upsertScore("host", hid, "responsiveness", 1 - v.slow / v.n, v);
    await upsertScore("host", hid, "conversion", v.conv / v.n, v);
    await upsertScore("host", hid, "priority", perf, v);
    n++;
  }
  return n;
}

export async function scoreRoutes(): Promise<number> {
  let rows: { routeType: string | null; leadScore: number }[] = [];
  try {
    rows = await prisma.growthAiLeadOrchestration.findMany({
      select: { routeType: true, leadScore: true },
      take: 5000,
    });
  } catch {
    return 0;
  }
  const byRoute: Record<string, { n: number; sumLead: number }> = {};
  for (const r of rows) {
    const rt = r.routeType ?? "unknown";
    if (!byRoute[rt]) byRoute[rt] = { n: 0, sumLead: 0 };
    byRoute[rt].n++;
    byRoute[rt].sumLead += r.leadScore;
  }
  let n = 0;
  for (const [rt, v] of Object.entries(byRoute)) {
    const score = v.sumLead / Math.max(1, v.n) + Math.log1p(v.n) * 0.1;
    await upsertScore("route", rt, "priority", score, v);
    n++;
  }
  return n;
}

export async function scoreTemplates(): Promise<number> {
  const tplRows = await prisma.growthAiTemplatePerformance.findMany({
    where: { sentCount: { gte: 3 } },
    take: 200,
  });
  let n = 0;
  for (const r of tplRows) {
    const dr = derivedRates(r);
    const quality =
      dr.bookedRate * 6 + dr.qualifiedRate * 3 + dr.replyRate * 2 - dr.staleRate * 4 - dr.handoffRate * 4;
    const key = `${r.templateKey}|${r.stage}|${r.detectedIntent}|${r.detectedObjection}|${r.highIntent}`;
    await upsertScore("template", key, "quality", quality, {
      templateKey: r.templateKey,
      stage: r.stage,
      sentCount: r.sentCount,
      rates: dr,
    });
    n++;
  }
  return n;
}

export async function runAllEntityScoring(): Promise<{
  cities: number;
  listings: number;
  brokers: number;
  hosts: number;
  routes: number;
  templates: number;
}> {
  const [cities, listings, brokers, hosts, routes, templates] = await Promise.all([
    scoreCities(),
    scoreListings(),
    scoreBrokers(),
    scoreHosts(),
    scoreRoutes(),
    scoreTemplates(),
  ]);
  return { cities, listings, brokers, hosts, routes, templates };
}
