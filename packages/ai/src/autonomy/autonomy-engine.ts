import { runAutonomyTick } from "./autonomy-runner";
import { loadResolvedAutonomyConfig } from "./autonomy-state";

export async function getAutonomyEngineSnapshot() {
  const cfg = await loadResolvedAutonomyConfig();
  return {
    globalMode: cfg.globalMode,
    normalizedMode: cfg.normalizedMode,
    automationsEnabled: cfg.automationsEnabled,
    globalKillSwitch: cfg.globalKillSwitch,
    autonomyPausedUntil: cfg.autonomyPausedUntil,
    domainKillSwitchesJson: cfg.domainKillSwitchesJson,
  };
}

export { runAutonomyTick };
