import "server-only";

import { getLegacyDB } from "@/lib/db/legacy";
import { logLecipmConflict } from "@/src/lib/core/conflict-guard";

import type { AutonomousOptimizationAction } from "./autonomousOptimizationLoop";

/**
 * Drops automation actions whose optional `resource` binding no longer matches stored `version`.
 * Actions without `resource` pass through unchanged (Dr. Brain signals stay lightweight).
 */
export async function filterAutomationActionsSkippingStaleVersions(
  actions: AutonomousOptimizationAction[],
): Promise<{ kept: AutonomousOptimizationAction[]; skipped: number }> {
  const prisma = getLegacyDB();
  const kept: AutonomousOptimizationAction[] = [];
  let skipped = 0;

  for (const action of actions) {
    const res = action.resource;
    if (!res) {
      kept.push(action);
      continue;
    }

    try {
      if (res.kind === "listing") {
        const row = await prisma.listing.findUnique({
          where: { id: res.id },
          select: { version: true },
        });
        const sv = row?.version ?? 1;
        if (sv !== res.expectedVersion) {
          skipped += 1;
          logLecipmConflict({
            scope: "dr_brain_automation",
            entity: "listing",
            listingId: res.id,
            expectedVersion: res.expectedVersion,
            serverVersion: sv,
          });
          continue;
        }
      } else if (res.kind === "deal") {
        const row = await prisma.deal.findUnique({
          where: { id: res.id },
          select: { version: true },
        });
        const sv = row?.version ?? 1;
        if (sv !== res.expectedVersion) {
          skipped += 1;
          logLecipmConflict({
            scope: "dr_brain_automation",
            entity: "deal",
            dealId: res.id,
            expectedVersion: res.expectedVersion,
            serverVersion: sv,
          });
          continue;
        }
      }
      kept.push(action);
    } catch (e) {
      skipped += 1;
      logLecipmConflict({
        scope: "dr_brain_automation",
        entity: res.kind,
        error: e instanceof Error ? e.message.slice(0, 120) : "unknown",
      });
    }
  }

  return { kept, skipped };
}
