"use client";

import type { SimulationActionInput } from "@/modules/growth/action-simulation.types";

const KEY = "growthActionSimPreset";

export function presetAndScrollToActionSimulation(partial: Partial<SimulationActionInput>): void {
  if (typeof window === "undefined") return;
  try {
    const base: Partial<SimulationActionInput> = {
      windowDays: 14,
      intensity: "medium",
      title: "Planned action",
      id: "preset",
      category: "demand_generation",
    };
    sessionStorage.setItem(KEY, JSON.stringify({ ...base, ...partial }));
  } catch {
    /* ignore */
  }
  document.getElementById("growth-mc-action-simulation")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function readAndClearActionSimulationPreset(): Partial<SimulationActionInput> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as Partial<SimulationActionInput>;
  } catch {
    return null;
  }
}
