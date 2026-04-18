/**
 * Optional additive persistence for fusion snapshots (not a source of truth).
 */
import { fusionSystemFlags } from "@/config/feature-flags";
import { logInfo, logWarn } from "@/lib/logger";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { FusionHealthSummary } from "./fusion-system.types";
import type { FusionSnapshot } from "./fusion-system.types";

const NS = "[fusion:system]";

export async function persistFusionSnapshotIfEnabled(
  snapshot: FusionSnapshot,
  health: FusionHealthSummary,
): Promise<string | null> {
  if (!fusionSystemFlags.fusionSystemPersistenceV1) {
    return null;
  }
  try {
    const row = await prisma.fusionSystemSnapshot.create({
      data: {
        payload: JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue,
        healthJson: JSON.parse(JSON.stringify(health)) as Prisma.InputJsonValue,
      },
    });
    logInfo(NS, { event: "fusion_snapshot_persisted", id: row.id });
    return row.id;
  } catch (e) {
    logWarn(NS, "fusion_snapshot_persist_failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}
