import { prisma } from "@/lib/db";
import type { LaunchSimulationAssumptions, LaunchSimulationScenario } from "@/modules/launch-simulation/launch-simulation.types";

export type StoredAssumptionOverrides = Partial<
  Record<LaunchSimulationScenario, Partial<LaunchSimulationAssumptions>>
>;

export type PitchSlideOverride = {
  headline?: string;
  bullets?: string[];
  speakerNotes?: string;
};

export type StoredPitchOverrides = Record<string, PitchSlideOverride>;

export function parseStoredAssumptions(raw: unknown): StoredAssumptionOverrides {
  if (!raw || typeof raw !== "object") return {};
  return raw as StoredAssumptionOverrides;
}

export async function getFounderSimulationState(userId: string) {
  return prisma.founderLaunchSimulationState.findUnique({ where: { userId } });
}

export async function patchScenarioAssumptions(
  userId: string,
  scenario: LaunchSimulationScenario,
  patch: Partial<LaunchSimulationAssumptions>
) {
  const existing = await prisma.founderLaunchSimulationState.findUnique({ where: { userId } });
  const prev = parseStoredAssumptions(existing?.assumptionsJson);
  const next: StoredAssumptionOverrides = {
    ...prev,
    [scenario]: { ...(prev[scenario] ?? {}), ...patch },
  };
  return prisma.founderLaunchSimulationState.upsert({
    where: { userId },
    create: {
      userId,
      assumptionsJson: next as object,
    },
    update: {
      assumptionsJson: next as object,
    },
  });
}

export async function patchPitchSlide(userId: string, slideNumber: number, patch: PitchSlideOverride) {
  const existing = await prisma.founderLaunchSimulationState.findUnique({ where: { userId } });
  const prev = (existing?.pitchOverridesJson as StoredPitchOverrides | null) ?? {};
  const key = String(slideNumber);
  const next = { ...prev, [key]: { ...prev[key], ...patch } };
  return prisma.founderLaunchSimulationState.upsert({
    where: { userId },
    create: {
      userId,
      assumptionsJson: (existing?.assumptionsJson as object) ?? {},
      pitchOverridesJson: next as object,
    },
    update: {
      pitchOverridesJson: next as object,
    },
  });
}
