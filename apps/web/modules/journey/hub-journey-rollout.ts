/**
 * Env-based hub allowlist for staged rollout — no remote config.
 * `FEATURE_HUB_JOURNEY_HUBS` — comma-separated hub keys; empty/unset = all hubs enabled.
 */

import type { HubKey } from "./hub-journey.types";
import { HUB_KEYS, isHubKey } from "./hub-journey.types";

export function getHubJourneyHubAllowlist(): Set<HubKey> | null {
  const raw = typeof process !== "undefined" ? process.env.FEATURE_HUB_JOURNEY_HUBS?.trim() : "";
  if (!raw) return null;
  const set = new Set<HubKey>();
  for (const part of raw.split(",")) {
    const k = part.trim().toLowerCase();
    if (isHubKey(k)) set.add(k);
  }
  return set.size > 0 ? set : null;
}

export function isHubJourneyRolloutEnabled(hub: HubKey): boolean {
  const allow = getHubJourneyHubAllowlist();
  if (!allow) return true;
  return allow.has(hub);
}

/** Dev-only sanity: allowlist references invalid tokens → warn once in logs. */
export function validateHubJourneyAllowlistEnv(): string[] {
  const raw = process.env.FEATURE_HUB_JOURNEY_HUBS?.trim();
  if (!raw) return [];
  const warnings: string[] = [];
  for (const part of raw.split(",")) {
    const k = part.trim().toLowerCase();
    if (!k) continue;
    if (!isHubKey(k)) warnings.push(`Unknown hub in FEATURE_HUB_JOURNEY_HUBS: ${part}`);
  }
  return warnings;
}

export function hubJourneyAllowlistSummary(): { mode: "all" | "restricted"; hubs: HubKey[] } {
  const allow = getHubJourneyHubAllowlist();
  if (!allow) return { mode: "all", hubs: [...HUB_KEYS] };
  return { mode: "restricted", hubs: [...allow].sort() };
}
