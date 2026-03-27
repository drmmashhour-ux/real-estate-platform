import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { isTrustGraphBillingEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export type UsageType =
  | "verification_run"
  | "document_extraction"
  | "external_api_call"
  | "premium_placement_eval"
  | "lead_routing_event";

export async function recordUsage(args: {
  workspaceId: string | null;
  usageType: UsageType;
  quantity?: number;
  metadata?: object;
}): Promise<void> {
  if (!isTrustGraphEnabled() || !isTrustGraphBillingEnabled()) return;

  await prisma.trustgraphUsageRecord.create({
    data: {
      workspaceId: args.workspaceId ?? undefined,
      usageType: args.usageType,
      quantity: args.quantity ?? 1,
      metadata: args.metadata as object | undefined,
    },
  });

  void recordPlatformEvent({
    eventType: "trustgraph_usage_recorded",
    sourceModule: "trustgraph",
    entityType: "USAGE",
    entityId: args.usageType,
    payload: { workspaceId: args.workspaceId, quantity: args.quantity ?? 1 },
  }).catch(() => {});
}
