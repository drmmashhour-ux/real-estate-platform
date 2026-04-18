/**
 * Built-in presentation presets only — no DB; user-defined persistence deferred.
 */
import type { CommandCenterRole } from "@/modules/control-center-v3/company-command-center-v3.types";
import type { CommandCenterPresetId, CommandCenterSavedPreset } from "../company-command-center-v4.types";

const BUILT_IN: CommandCenterSavedPreset[] = [
  {
    id: "founder_daily",
    name: "Founder Daily",
    role: "founder",
    visibleSections: ["briefing", "digest", "deltas", "role"],
    pinnedSystems: ["brain", "ranking", "growth_loop"],
    builtIn: true,
  },
  {
    id: "growth_focus",
    name: "Growth Focus",
    role: "growth",
    visibleSections: ["briefing", "digest", "deltas", "role"],
    pinnedSystems: ["ads", "cro", "ranking", "growth_loop"],
    builtIn: true,
  },
  {
    id: "operations_watch",
    name: "Operations Watch",
    role: "operations",
    visibleSections: ["briefing", "digest", "deltas", "role"],
    pinnedSystems: ["operator", "platform_core", "swarm"],
    builtIn: true,
  },
  {
    id: "risk_review",
    name: "Risk Review",
    role: "risk_governance",
    visibleSections: ["digest", "deltas", "briefing", "role"],
    pinnedSystems: ["brain", "ranking", "fusion", "swarm"],
    builtIn: true,
  },
];

export function listBuiltInPresets(): CommandCenterSavedPreset[] {
  return [...BUILT_IN];
}

export function getPresetById(id: string | null | undefined): CommandCenterSavedPreset | null {
  if (!id) return null;
  return BUILT_IN.find((p) => p.id === id) ?? null;
}

export function resolveRoleFromPreset(presetId: string | null | undefined, fallback: CommandCenterRole): CommandCenterRole {
  const p = getPresetById(presetId);
  return p?.role ?? fallback;
}

export type PresetCrudResult =
  | { ok: true; preset: CommandCenterSavedPreset }
  | { ok: false; error: "not_persisted" };

/** Stub CRUD — persistence not enabled; only built-ins list. */
export async function listPresets(): Promise<CommandCenterSavedPreset[]> {
  return listBuiltInPresets();
}

export async function readPreset(id: string): Promise<PresetCrudResult> {
  const p = getPresetById(id);
  if (p) return { ok: true, preset: p };
  return { ok: false, error: "not_persisted" };
}

export async function createPreset(): Promise<PresetCrudResult> {
  return { ok: false, error: "not_persisted" };
}

export async function updatePreset(): Promise<PresetCrudResult> {
  return { ok: false, error: "not_persisted" };
}

export async function deletePreset(): Promise<{ ok: false; error: "not_persisted" }> {
  return { ok: false, error: "not_persisted" };
}
