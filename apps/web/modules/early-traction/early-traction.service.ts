import { buildFirstUsersSnapshot } from "./first-users-tracker.service";
import { buildOnboardingOptimizerReport } from "./onboarding-optimizer.service";
import { buildManualAcquisitionSnapshot } from "./manual-acquisition.service";
import type { EarlyTractionSnapshot } from "./early-traction.types";

export type EarlyTractionBundle = {
  firstUsers: EarlyTractionSnapshot;
  onboarding: Awaited<ReturnType<typeof buildOnboardingOptimizerReport>>;
  manualPipeline: Awaited<ReturnType<typeof buildManualAcquisitionSnapshot>>;
};

export async function buildEarlyTractionBundle(sampleSize = 100): Promise<EarlyTractionBundle> {
  const [firstUsers, onboarding, manualPipeline] = await Promise.all([
    buildFirstUsersSnapshot(sampleSize),
    buildOnboardingOptimizerReport(),
    buildManualAcquisitionSnapshot(),
  ]);
  return { firstUsers, onboarding, manualPipeline };
}

export { buildFirstUsersSnapshot } from "./first-users-tracker.service";
