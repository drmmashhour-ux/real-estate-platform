import "server-only";

import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";
import { autopilotToAutonomyMode } from "@/lib/system-brain/autonomy-modes";
import type { AutopilotMode } from "@/lib/ai/types";

export type AutonomyEngineSnapshot = {
  normalizedMode: string;
  globalMode: string;
  globalKillSwitch: boolean;
  automationsEnabled: boolean;
  autonomyPausedUntil: string | null;
};

export async function getAutonomyEngineSnapshot(): Promise<AutonomyEngineSnapshot> {
  const s = await getManagerAiPlatformSettings();
  const normalizedMode = autopilotToAutonomyMode(s.globalMode as AutopilotMode);
  return {
    normalizedMode,
    globalMode: s.globalMode,
    globalKillSwitch: s.globalKillSwitch,
    automationsEnabled: s.automationsEnabled,
    autonomyPausedUntil: s.autonomyPausedUntil ? s.autonomyPausedUntil.toISOString() : null,
  };
}
