/**
 * Clone winning-market configuration onto a target city: pricing rows, weight snapshots,
 * and playbook metadata (onboarding / messaging keys).
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PLAYBOOK_DEFAULTS } from "./senior-expansion-playbook.service";

export type ExpansionWeightsSnapshot = {
  matchingWeights: {
    careWeight: number;
    budgetWeight: number;
    locationWeight: number;
    serviceWeight: number;
  };
  leadScoringWeights: {
    wEngagement: number;
    wBudget: number;
    wCare: number;
    wIntent: number;
    wSource: number;
  };
  onboardingFlowKey: string;
  messagingTemplateKeys: string[];
  clonedFromCityId: string;
  clonedFromCityName: string;
  clonedAt: string;
};

async function loadMatchingSnapshot(): Promise<ExpansionWeightsSnapshot["matchingWeights"]> {
  const row = await prisma.matchingWeight.findFirst({ orderBy: { updatedAt: "desc" } });
  return {
    careWeight: row?.careWeight ?? 0.35,
    budgetWeight: row?.budgetWeight ?? 0.25,
    locationWeight: row?.locationWeight ?? 0.2,
    serviceWeight: row?.serviceWeight ?? 0.2,
  };
}

async function loadLeadScoringSnapshot(): Promise<ExpansionWeightsSnapshot["leadScoringWeights"]> {
  const row = await prisma.leadScoringWeights.findFirst({ orderBy: { updatedAt: "desc" } });
  return {
    wEngagement: row?.wEngagement ?? 0.25,
    wBudget: row?.wBudget ?? 0.25,
    wCare: row?.wCare ?? 0.25,
    wIntent: row?.wIntent ?? 0.15,
    wSource: row?.wSource ?? 0.1,
  };
}

function snapshotFromJson(
  json: Prisma.JsonValue | null | undefined,
): Partial<ExpansionWeightsSnapshot> | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  const out: Partial<ExpansionWeightsSnapshot> = {};
  if (o.matchingWeights && typeof o.matchingWeights === "object") out.matchingWeights = o.matchingWeights as ExpansionWeightsSnapshot["matchingWeights"];
  if (o.leadScoringWeights && typeof o.leadScoringWeights === "object") {
    out.leadScoringWeights = o.leadScoringWeights as ExpansionWeightsSnapshot["leadScoringWeights"];
  }
  if (typeof o.onboardingFlowKey === "string") out.onboardingFlowKey = o.onboardingFlowKey;
  if (Array.isArray(o.messagingTemplateKeys)) {
    out.messagingTemplateKeys = o.messagingTemplateKeys.filter((x) => typeof x === "string") as string[];
  }
  return Object.keys(out).length ? out : null;
}

/** Highest-readiness city in an optional country filter (for picking a “best” template). */
export async function getBestSeniorCityTemplate(country?: string): Promise<{ id: string; name: string } | null> {
  const row = await prisma.seniorCity.findFirst({
    where: country ? { country } : {},
    orderBy: [{ readinessScore: "desc" }, { updatedAt: "desc" }],
  });
  if (!row) return null;
  return { id: row.id, name: row.name };
}

async function pricingRulesForSourceCity(sourceCityName: string) {
  const norm = sourceCityName.trim();
  const direct = await prisma.seniorPricingRule.findMany({
    where: { city: { equals: norm, mode: "insensitive" } },
  });
  if (direct.length) return direct;
  return prisma.seniorPricingRule.findMany({
    where: { city: null },
    take: 20,
  });
}

export type CloneSeniorCityResult = {
  targetCityId: string;
  pricingRulesCreated: number;
  weightsSnapshot: ExpansionWeightsSnapshot;
  appliedGlobalWeights: boolean;
};

/**
 * Copy pricing rules to the target city name, and store a full weight + playbook snapshot on `SeniorCity`.
 * Global `MatchingWeight` / `LeadScoringWeights` are optional (admin-only) because they affect all markets.
 */
export async function cloneSeniorCityConfiguration(params: {
  sourceCityId: string;
  targetCityId: string;
  /** When true, overwrites singleton weight tables from the resolved snapshot (admin use). */
  applyGlobalWeights?: boolean;
}): Promise<CloneSeniorCityResult> {
  const [source, target] = await Promise.all([
    prisma.seniorCity.findUnique({ where: { id: params.sourceCityId } }),
    prisma.seniorCity.findUnique({ where: { id: params.targetCityId } }),
  ]);
  if (!source || !target) {
    throw new Error("cloneSeniorCityConfiguration: source or target city not found");
  }

  const template = snapshotFromJson(source.expansionWeightsJson);
  const [mw, lw] = await Promise.all([loadMatchingSnapshot(), loadLeadScoringSnapshot()]);
  const snapshot: ExpansionWeightsSnapshot = {
    matchingWeights: template?.matchingWeights ?? mw,
    leadScoringWeights: template?.leadScoringWeights ?? lw,
    onboardingFlowKey: template?.onboardingFlowKey ?? PLAYBOOK_DEFAULTS.onboardingFlowKey,
    messagingTemplateKeys: template?.messagingTemplateKeys?.length
      ? template.messagingTemplateKeys
      : [...PLAYBOOK_DEFAULTS.messagingTemplateKeys],
    clonedFromCityId: source.id,
    clonedFromCityName: source.name.trim(),
    clonedAt: new Date().toISOString(),
  };

  const rules = await pricingRulesForSourceCity(source.name);
  const targetName = target.name.trim();

  await prisma.$transaction(async (tx) => {
    await tx.seniorPricingRule.deleteMany({
      where: { city: { equals: targetName, mode: "insensitive" } },
    });

    for (const r of rules) {
      await tx.seniorPricingRule.create({
        data: {
          city: targetName,
          leadBasePrice: r.leadBasePrice,
          minPrice: r.minPrice,
          maxPrice: r.maxPrice,
          demandFactor: r.demandFactor,
          qualityFactor: r.qualityFactor,
        },
      });
    }

    await tx.seniorCity.update({
      where: { id: target.id },
      data: {
        expansionWeightsJson: snapshot as unknown as Prisma.InputJsonValue,
        expansionClonedFromCity: source.name.trim(),
      },
    });

    if (params.applyGlobalWeights) {
      const mwRow = await tx.matchingWeight.findFirst({ orderBy: { updatedAt: "desc" } });
      if (mwRow) {
        await tx.matchingWeight.update({
          where: { id: mwRow.id },
          data: {
            careWeight: snapshot.matchingWeights.careWeight,
            budgetWeight: snapshot.matchingWeights.budgetWeight,
            locationWeight: snapshot.matchingWeights.locationWeight,
            serviceWeight: snapshot.matchingWeights.serviceWeight,
          },
        });
      } else {
        await tx.matchingWeight.create({
          data: {
            careWeight: snapshot.matchingWeights.careWeight,
            budgetWeight: snapshot.matchingWeights.budgetWeight,
            locationWeight: snapshot.matchingWeights.locationWeight,
            serviceWeight: snapshot.matchingWeights.serviceWeight,
          },
        });
      }

      const lsRow = await tx.leadScoringWeights.findFirst({ orderBy: { updatedAt: "desc" } });
      if (lsRow) {
        await tx.leadScoringWeights.update({
          where: { id: lsRow.id },
          data: {
            wEngagement: snapshot.leadScoringWeights.wEngagement,
            wBudget: snapshot.leadScoringWeights.wBudget,
            wCare: snapshot.leadScoringWeights.wCare,
            wIntent: snapshot.leadScoringWeights.wIntent,
            wSource: snapshot.leadScoringWeights.wSource,
          },
        });
      } else {
        await tx.leadScoringWeights.create({
          data: {
            wEngagement: snapshot.leadScoringWeights.wEngagement,
            wBudget: snapshot.leadScoringWeights.wBudget,
            wCare: snapshot.leadScoringWeights.wCare,
            wIntent: snapshot.leadScoringWeights.wIntent,
            wSource: snapshot.leadScoringWeights.wSource,
          },
        });
      }
    }
  });

  return {
    targetCityId: target.id,
    pricingRulesCreated: rules.length,
    weightsSnapshot: snapshot,
    appliedGlobalWeights: Boolean(params.applyGlobalWeights),
  };
}
