"use server";

import { oneBrainV2Flags, platformCoreFlags } from "@/config/feature-flags";
import { buildBrainOutputWithV8Routing } from "@/modules/platform-core/brain-v8-primary-routing.service";
import { logInfo } from "@/lib/logger";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  approveDecision,
  dismissDecision,
  executeDecisionInternal,
  rollbackDecisionInternal,
} from "@/modules/platform-core/platform-core.service";
import { cancelTask } from "@/modules/platform-core/platform-task-queue.service";
import { updateTaskStatus } from "@/modules/platform-core/platform-core.repository";
import { collectRecentDecisionOutcomes } from "@/modules/platform-core/brain-outcome-ingestion.service";
import { runBrainAdaptiveLearning } from "@/modules/platform-core/brain-v2-learning.service";
import { buildBrainSnapshot } from "@/modules/platform-core/brain-snapshot.service";

async function requireAdminForPlatformCore() {
  if (!platformCoreFlags.platformCoreV1) {
    throw new Error("Platform core is disabled.");
  }
  const s = await requireAdminSession();
  if (!s.ok) throw new Error(s.error);
  return s.userId;
}

export async function approvePlatformDecision(id: string, note?: string) {
  const reviewerUserId = await requireAdminForPlatformCore();
  if (!platformCoreFlags.platformCoreApprovalsV1) {
    throw new Error("Approvals disabled (FEATURE_PLATFORM_CORE_APPROVALS_V1).");
  }
  await approveDecision({ decisionId: id, reviewerUserId, note });
  return { ok: true as const };
}

export async function dismissPlatformDecision(id: string, note?: string) {
  const reviewerUserId = await requireAdminForPlatformCore();
  if (!platformCoreFlags.platformCoreApprovalsV1) {
    throw new Error("Approvals disabled (FEATURE_PLATFORM_CORE_APPROVALS_V1).");
  }
  await dismissDecision({ decisionId: id, reviewerUserId, note });
  return { ok: true as const };
}

export async function executePlatformDecision(id: string, note?: string) {
  const actorUserId = await requireAdminForPlatformCore();
  void note;
  await executeDecisionInternal({ decisionId: id, actorUserId });
  return { ok: true as const };
}

export async function rollbackPlatformDecision(id: string, note?: string) {
  const actorUserId = await requireAdminForPlatformCore();
  await rollbackDecisionInternal({ decisionId: id, actorUserId, note });
  return { ok: true as const };
}

export async function retryPlatformTask(id: string) {
  await requireAdminForPlatformCore();
  await updateTaskStatus(id, "QUEUED", { lastError: null });
  return { ok: true as const };
}

export async function cancelPlatformTask(id: string) {
  await requireAdminForPlatformCore();
  await cancelTask(id);
  return { ok: true as const };
}

export async function runBrainOutcomeIngestionAction() {
  await requireAdminForPlatformCore();
  if (!oneBrainV2Flags.oneBrainV2OutcomeIngestionV1) {
    throw new Error("One Brain V2 outcome ingestion is disabled (FEATURE_ONE_BRAIN_V2_OUTCOME_INGESTION_V1).");
  }
  return collectRecentDecisionOutcomes();
}

export async function runBrainAdaptiveLearningAction() {
  await requireAdminForPlatformCore();
  if (!oneBrainV2Flags.oneBrainV2AdaptiveV1) {
    throw new Error("One Brain V2 adaptive learning is disabled (FEATURE_ONE_BRAIN_V2_ADAPTIVE_V1).");
  }
  return runBrainAdaptiveLearning();
}

/** Legacy read-only snapshot — no Phase C/D overlay (parallel opt-in: {@link getBrainSnapshotWithV8OverlayAction}). */
export async function getBrainSnapshotAction() {
  await requireAdminForPlatformCore();
  logInfo("[brain:v8:parallel-entry]", { event: "server_action", path: "legacy_snapshot", overlayApplied: false });
  return buildBrainSnapshot();
}

/** Opt-in: snapshot after {@link buildBrainOutputWithV8Routing} (Phase C overlay / Phase D primary when enabled). */
export async function getBrainSnapshotWithV8OverlayAction() {
  await requireAdminForPlatformCore();
  logInfo("[brain:v8:parallel-entry]", { event: "server_action", path: "v8_overlay", routing: "buildBrainOutputWithV8Routing" });
  const snapshot = await buildBrainSnapshot();
  return buildBrainOutputWithV8Routing(snapshot);
}
