import { NextRequest, NextResponse } from "next/server";
import { LecipmLegalBoundaryEntityType } from "@prisma/client";
import { getOrSyncTransactionContext } from "@/modules/legal-boundary/transaction-context.service";
import { getAllowedCapabilities } from "@/modules/legal-boundary/compliance-capability-guard";

export const dynamic = "force-dynamic";

function parseEntityType(raw: string | null): LecipmLegalBoundaryEntityType | null {
  if (raw === "LISTING" || raw === "DEAL" || raw === "BOOKING") return raw;
  return null;
}

/** GET /api/legal-boundary/context — resolve transaction mode + capability flags (UI badges). */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const entityType = parseEntityType(searchParams.get("entityType"));
  const entityId = searchParams.get("entityId")?.trim() ?? "";
  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
  }

  const context = await getOrSyncTransactionContext({ entityType, entityId });
  const capabilities = getAllowedCapabilities(context);

  return NextResponse.json({
    context: {
      id: context.id,
      entityType: context.entityType,
      entityId: context.entityId,
      mode: context.mode,
      brokerId: context.brokerId,
      complianceState: context.complianceState,
      modeSource: context.modeSource,
    },
    capabilities,
  });
}
