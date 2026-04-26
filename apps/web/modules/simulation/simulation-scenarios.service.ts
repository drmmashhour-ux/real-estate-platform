import type { ScenarioInput, SavedScenarioListItem, WhatIfResult } from "./simulation.types";
import { runWhatIfSimulation } from "./simulation.engine";
import { loadSimulationBaseline } from "./simulation-baseline.service";
import { simulationLog } from "./simulation-log";
import type { PlatformRole } from "@prisma/client";

import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

function mapRow(
  r: {
    id: string;
    name: string;
    regionKey: string | null;
    params: unknown;
    isRecommended: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastResultJson: unknown;
  },
): SavedScenarioListItem {
  return {
    id: r.id,
    name: r.name,
    regionKey: r.regionKey,
    params: r.params as ScenarioInput,
    isRecommended: r.isRecommended,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    lastResult: (r.lastResultJson as WhatIfResult | null) ?? null,
  };
}

export async function listScenarios(userId: string): Promise<SavedScenarioListItem[]> {
  const rows = await prisma.lecipmWhatIfScenario.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return rows.map(mapRow);
}

export async function createScenario(
  userId: string,
  name: string,
  params: ScenarioInput,
  role: PlatformRole,
): Promise<SavedScenarioListItem> {
  const baseline = await loadSimulationBaseline(userId, role, params.regionKey);
  const result = runWhatIfSimulation(baseline, params);
  const row = await prisma.lecipmWhatIfScenario.create({
    data: {
      userId,
      name: name.slice(0, 160),
      regionKey: params.regionKey,
      params: params as object,
      lastResultJson: result as object,
    },
  });
  simulationLog.emit("scenario_saved", { userId, input: params, scenarioId: row.id });
  return mapRow({ ...row, lastResultJson: result });
}

export async function updateScenario(
  id: string,
  userId: string,
  patch: { name?: string; isRecommended?: boolean; params?: ScenarioInput },
  role: PlatformRole,
): Promise<SavedScenarioListItem | null> {
  const existing = await prisma.lecipmWhatIfScenario.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const nextParams = (patch.params ?? (existing.params as ScenarioInput)) as ScenarioInput;
  const recompute = patch.params != null;
  const baseline = recompute ? await loadSimulationBaseline(userId, role, nextParams.regionKey) : null;
  const result = recompute && baseline ? runWhatIfSimulation(baseline, nextParams) : null;

  const row = await prisma.lecipmWhatIfScenario.update({
    where: { id },
    data: {
      ...(patch.name != null ? { name: patch.name.slice(0, 160) } : {}),
      ...(patch.isRecommended != null ? { isRecommended: patch.isRecommended } : {}),
      ...(patch.params != null ? { params: nextParams as object, regionKey: nextParams.regionKey } : {}),
      ...(result ? { lastResultJson: result as object } : {}),
    },
  });
  if (patch.isRecommended === true) {
    simulationLog.emit("scenario_recommended", { userId, scenarioId: id });
  }
  return mapRow({
    ...row,
    lastResultJson: result ?? (row.lastResultJson as object | null),
  });
}

export async function deleteScenario(id: string, userId: string): Promise<boolean> {
  const n = await prisma.lecipmWhatIfScenario.deleteMany({ where: { id, userId } });
  if (n.count > 0) simulationLog.emit("scenario_deleted", { userId, scenarioId: id });
  return n.count > 0;
}
