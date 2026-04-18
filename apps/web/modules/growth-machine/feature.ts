import { engineFlags } from "@/config/feature-flags";

export function isGrowthMachineEnabled(): boolean {
  return engineFlags.growthMachineV1;
}
