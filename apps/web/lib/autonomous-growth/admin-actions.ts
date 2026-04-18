"use server";

import { autonomousGrowthFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  getAutonomousRunById,
  listAutonomousRunEvents,
  listRecentAutonomousRuns,
} from "@/modules/autonomous-growth/autonomous-growth.repository";
import { runFullAutonomousGrowthCycle } from "@/modules/autonomous-growth/autonomous-growth.orchestrator";
import { reevaluateAutonomousRun } from "@/modules/autonomous-growth/autonomous-reevaluation.service";

async function requireAdminForAutonomousGrowth() {
  if (!autonomousGrowthFlags.autonomousGrowthSystemV1) {
    throw new Error("Autonomous Growth System is disabled (FEATURE_AUTONOMOUS_GROWTH_SYSTEM_V1).");
  }
  const s = await requireAdminSession();
  if (!s.ok) throw new Error(s.error);
  return s.userId;
}

export async function runFullAutonomousGrowthCycleAction() {
  await requireAdminForAutonomousGrowth();
  return runFullAutonomousGrowthCycle();
}

export async function simulateFullAutonomousGrowthCycleAction() {
  await requireAdminForAutonomousGrowth();
  return runFullAutonomousGrowthCycle({ simulateOnly: true });
}

export async function reevaluateAutonomousRunAction(runId: string) {
  await requireAdminForAutonomousGrowth();
  return reevaluateAutonomousRun(runId);
}

export async function listRecentAutonomousRunsAction(limit?: number) {
  await requireAdminForAutonomousGrowth();
  return listRecentAutonomousRuns(limit);
}

export async function getAutonomousRunDetailsAction(runId: string) {
  await requireAdminForAutonomousGrowth();
  const run = await getAutonomousRunById(runId);
  const events = await listAutonomousRunEvents(runId, 300);
  return { run, events };
}
