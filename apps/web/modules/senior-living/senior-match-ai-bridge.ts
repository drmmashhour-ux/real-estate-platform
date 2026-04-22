/**
 * Keeps guided-flow `SeniorMatchProfile` in sync with maximum-AI `SeniorAiProfile`.
 */
import type { Prisma, SeniorMatchProfile } from "@prisma/client";

function whoForFromMatchName(name: string): string | undefined {
  const n = name.trim().toLowerCase();
  if (n === "me") return "SELF";
  if (n.includes("parent")) return "PARENT";
  if (n.includes("someone")) return "OTHER";
  return "OTHER";
}

function careNeedLevelFrom(mp: {
  mobilityLevel?: string | null;
  medicalNeeds?: string | null;
}): string | undefined {
  const med = mp.medicalNeeds?.toUpperCase() ?? "";
  const mob = mp.mobilityLevel?.toUpperCase() ?? "";
  if (med.includes("HEAVY") || mob.includes("DEPENDENT")) return "HIGH";
  if (med.includes("LIGHT") || mob.includes("LIMITED")) return "MEDIUM";
  return "LOW";
}

function budgetBandFromBudget(b: number | null | undefined): string | undefined {
  if (b == null) return undefined;
  if (b < 4000) return "LOW";
  if (b < 7000) return "MID";
  return "HIGH";
}

export function seniorAiCreateFromMatchProfile(mp: SeniorMatchProfile): Prisma.SeniorAiProfileCreateInput {
  const care = careNeedLevelFrom(mp);
  return {
    seniorMatchProfile: { connect: { id: mp.id } },
    userId: mp.userId ?? undefined,
    whoFor: whoForFromMatchName(mp.name),
    mobilityLevel: mp.mobilityLevel ?? undefined,
    careNeedLevel: care,
    medicalSupportNeeded: mp.medicalNeeds?.toUpperCase().includes("HEAVY") ?? false,
    mealSupportNeeded: care === "HIGH",
    budgetBand: budgetBandFromBudget(mp.budget ?? null),
    preferredCity: mp.preferredCity ?? undefined,
    profileConfidence: 0.55,
  };
}
