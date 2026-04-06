import type { AgentKey, AutopilotMode } from "../types";
import { normalizeAutonomyMode } from "../types";
import type { AutonomyDomain } from "../policies/domain-policy";
import { domainPaused } from "../policies/domain-policy";

export type ResolvedAutonomyConfig = {
  globalMode: AutopilotMode;
  normalizedMode: AutopilotMode;
  automationsEnabled: boolean;
  globalKillSwitch: boolean;
  domainKillSwitchesJson: unknown;
  autonomyPausedUntil: Date | null;
  agentModes: Partial<Record<AgentKey, AutopilotMode>>;
};

export function effectiveAgentMode(cfg: ResolvedAutonomyConfig, agent: AgentKey): AutopilotMode {
  const o = cfg.agentModes[agent];
  return normalizeAutonomyMode(o ?? cfg.globalMode);
}

export function isAutomationDomainActive(cfg: ResolvedAutonomyConfig, domain: AutonomyDomain): boolean {
  if (cfg.globalKillSwitch) return false;
  if (cfg.autonomyPausedUntil && cfg.autonomyPausedUntil > new Date()) return false;
  if (!cfg.automationsEnabled) return false;
  return !domainPaused(domain, cfg.domainKillSwitchesJson);
}
