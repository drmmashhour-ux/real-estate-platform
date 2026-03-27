import { isPublishAllowed } from "@/src/modules/ai-growth-engine/domain/growth.policies";
import type { PublishResult } from "@/src/modules/ai-growth-engine/domain/growth.types";
import { markPublished } from "@/src/modules/ai-growth-engine/infrastructure/growthRepository";

/**
 * Auto-publisher: **does not** call external APIs by default (platform tokens not in repo).
 * Marks approved items as published in DB and returns a queue message for external workers.
 */
export async function publishContent(args: {
  itemId: string;
  status: string;
  humanApprovedAt: Date | null;
  /** When true, simulate external publish (still no outbound network). */
  dryRun?: boolean;
}): Promise<PublishResult> {
  if (!isPublishAllowed({ status: args.status, humanApprovedAt: args.humanApprovedAt })) {
    return { status: "skipped", reason: "Human approval required before publish." };
  }
  if (args.dryRun) {
    return { status: "queued", message: "Dry run — no external webhook." };
  }
  try {
    await markPublished(args.itemId);
    return {
      status: "queued",
      externalId: `lecipm-internal:${args.itemId}`,
      message: "Recorded as published. Connect platform webhooks in infrastructure to send outbound.",
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "publish failed";
    return { status: "failed", error };
  }
}
