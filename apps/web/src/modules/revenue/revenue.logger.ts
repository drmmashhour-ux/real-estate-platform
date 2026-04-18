import { prisma } from "@/lib/db";
import { toPrismaJson } from "@/lib/types/prisma-json";
import { revenueV4Flags } from "@/config/feature-flags";

function revenueAuditWritesEnabled(): boolean {
  return (
    revenueV4Flags.revenueEngineV1 ||
    revenueV4Flags.pricingEngineV1 ||
    revenueV4Flags.bnhubDynamicPricingV1 ||
    revenueV4Flags.monetizationEngineV1 ||
    revenueV4Flags.investorInsightsV1
  );
}

export async function logRevenueEngineV4Event(args: {
  engine: "revenue" | "pricing" | "monetization" | "investor" | "bnhub_pricing";
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  inputJson?: Record<string, unknown> | null;
  outputJson?: Record<string, unknown> | null;
  confidence?: number | null;
  explanation?: string | null;
}): Promise<{ id: string } | null> {
  if (!revenueAuditWritesEnabled()) return null;

  const row = await prisma.revenueEngineV4AuditLog.create({
    data: {
      engine: args.engine,
      action: args.action,
      entityType: args.entityType ?? undefined,
      entityId: args.entityId ?? undefined,
      inputJson: args.inputJson != null ? toPrismaJson(args.inputJson) : undefined,
      outputJson: args.outputJson != null ? toPrismaJson(args.outputJson) : undefined,
      confidence: args.confidence ?? undefined,
      explanation: args.explanation ?? undefined,
    },
  });
  return { id: row.id };
}
