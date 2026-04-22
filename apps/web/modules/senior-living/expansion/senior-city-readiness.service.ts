/**
 * City readiness scoring + status transitions (LOCKED → TESTING → ACTIVE → DOMINANT).
 */
import { prisma } from "@/lib/db";
import {
  ensureExpansionTasksForCity,
  syncExpansionTasksFromMetrics,
} from "./senior-expansion-playbook.service";

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function clamp100(x: number): number {
  return Math.max(0, Math.min(100, x));
}

/** Normalize demand from lead volume (tunable targets). */
export function demandScoreFromLeads(leadCount: number): number {
  return clamp100((leadCount / 45) * 100);
}

/** Normalize supply from distinct operators in city. */
export function supplyScoreFromOperators(operatorCount: number): number {
  return clamp100((operatorCount / 12) * 100);
}

export function leadGrowthRateScore(current30: number, prior30: number): number {
  const base = Math.max(prior30, 3);
  const ratio = (current30 - prior30) / base;
  const normalized = clamp01((ratio + 0.25) / 1.25);
  return normalized * 100;
}

export function computeReadinessScore(parts: {
  demandScore: number;
  supplyScore: number;
  conversionRate01: number | null;
  leadGrowthRateScore: number;
}): number {
  const conv = parts.conversionRate01 != null ? clamp100(parts.conversionRate01 * 100) : 35;
  const raw =
    0.3 * parts.demandScore +
    0.25 * parts.supplyScore +
    0.2 * conv +
    0.25 * parts.leadGrowthRateScore;
  return Math.round(raw * 10) / 10;
}

export function statusFromReadiness(readiness: number): "LOCKED" | "TESTING" | "ACTIVE" | "DOMINANT" {
  if (readiness > 92) return "DOMINANT";
  if (readiness > 85) return "ACTIVE";
  if (readiness > 70) return "TESTING";
  return "LOCKED";
}

async function leadsBetween(cityNorm: string, start: Date, end: Date): Promise<number> {
  return prisma.seniorLead.count({
    where: {
      createdAt: { gte: start, lt: end },
      residence: { city: { equals: cityNorm, mode: "insensitive" } },
    },
  });
}

async function operatorCountForCity(cityNorm: string): Promise<number> {
  const ops = await prisma.seniorResidence.findMany({
    where: { city: { equals: cityNorm, mode: "insensitive" } },
    select: { operatorId: true },
    distinct: ["operatorId"],
  });
  return ops.filter((o) => o.operatorId != null).length;
}

async function conversionRateForCity(cityNorm: string): Promise<number | null> {
  const ninety = new Date();
  ninety.setDate(ninety.getDate() - 90);
  const leads = await prisma.seniorLead.count({
    where: {
      createdAt: { gte: ninety },
      residence: { city: { equals: cityNorm, mode: "insensitive" } },
    },
  });
  if (leads === 0) return null;
  const closed = await prisma.seniorLead.count({
    where: {
      createdAt: { gte: ninety },
      status: "CLOSED",
      residence: { city: { equals: cityNorm, mode: "insensitive" } },
    },
  });
  return closed / leads;
}

async function leadCountWindow(cityNorm: string, days: number): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.seniorLead.count({
    where: {
      createdAt: { gte: since },
      residence: { city: { equals: cityNorm, mode: "insensitive" } },
    },
  });
}

/** Refresh metrics + readiness for one tracked city row. */
export async function refreshSeniorCityMetrics(cityId: string): Promise<void> {
  const row = await prisma.seniorCity.findUnique({ where: { id: cityId } });
  if (!row) return;

  const cityNorm = row.name.trim();
  const now = new Date();
  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now);
  d60.setDate(d60.getDate() - 60);

  const [opCount, current30, midSlice, conv] = await Promise.all([
    operatorCountForCity(cityNorm),
    leadsBetween(cityNorm, d30, now),
    leadsBetween(cityNorm, d60, d30),
    conversionRateForCity(cityNorm),
  ]);

  const demand = demandScoreFromLeads(current30);
  const supply = supplyScoreFromOperators(opCount);
  const growthScore = leadGrowthRateScore(current30, midSlice);
  const readiness = computeReadinessScore({
    demandScore: demand,
    supplyScore: supply,
    conversionRate01: conv,
    leadGrowthRateScore: growthScore,
  });
  const suggested = statusFromReadiness(readiness);
  const leads90 = await leadCountWindow(cityNorm, 90);

  await prisma.seniorCity.update({
    where: { id: cityId },
    data: {
      operatorCount: opCount,
      leadCount: leads90,
      conversionRate: conv ?? undefined,
      demandScore: demand,
      supplyScore: supply,
      leadGrowthRate: growthScore,
      readinessScore: readiness,
      status: advanceStatus(row.status, suggested),
    },
  });

  await ensureExpansionTasksForCity(cityId);
  await syncExpansionTasksFromMetrics(cityId);
}

function advanceStatus(current: string, suggested: string): string {
  const order = ["LOCKED", "TESTING", "ACTIVE", "DOMINANT"];
  const ci = order.indexOf(current);
  const si = order.indexOf(suggested);
  if (ci < 0) return suggested;
  if (si < 0) return current;
  return order[Math.max(ci, si)] as string;
}

export async function refreshAllSeniorCities(): Promise<number> {
  const cities = await prisma.seniorCity.findMany({ select: { id: true } });
  for (const c of cities) {
    await refreshSeniorCityMetrics(c.id);
  }
  return cities.length;
}
