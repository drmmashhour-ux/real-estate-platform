import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";
import { domainPaused, type AutonomyDomain } from "../policies/domain-policy";
import { normalizeAutonomyMode } from "../types";
import type { ResolvedAutonomyConfig } from "./autonomy-config";

export async function loadResolvedAutonomyConfig(): Promise<ResolvedAutonomyConfig> {
  const base = await getManagerAiPlatformSettings();
  return {
    globalMode: base.globalMode,
    normalizedMode: normalizeAutonomyMode(base.globalMode),
    automationsEnabled: base.automationsEnabled,
    globalKillSwitch: base.globalKillSwitch,
    domainKillSwitchesJson: base.domainKillSwitchesJson,
    autonomyPausedUntil: base.autonomyPausedUntil,
    agentModes: base.agentModes,
  };
}

export type AutomationGateResult =
  | { ok: true }
  | { ok: false; reason: "kill_switch" | "paused" | "automations_disabled" | "mode_off" | "domain_paused" };

export async function assertPlatformAutomationGate(domain?: string): Promise<AutomationGateResult> {
  const cfg = await loadResolvedAutonomyConfig();
  if (cfg.globalKillSwitch) return { ok: false, reason: "kill_switch" };
  if (cfg.autonomyPausedUntil && cfg.autonomyPausedUntil > new Date()) return { ok: false, reason: "paused" };
  if (!cfg.automationsEnabled) return { ok: false, reason: "automations_disabled" };
  const m = cfg.normalizedMode;
  if (m === "OFF" || m === "ASSIST_ONLY") return { ok: false, reason: "mode_off" };
  if (domain && domainPaused(domain as AutonomyDomain, cfg.domainKillSwitchesJson)) {
    return { ok: false, reason: "domain_paused" };
  }
  return { ok: true };
}
