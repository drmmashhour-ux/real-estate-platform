import { DealFinancingCoordinationStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canMutateCoordination, loadDealForCoordination } from "@/lib/deals/coordination-access";
import { coordinationFlags } from "@/lib/deals/coordination-feature-flags";
import type { LenderMetadataV1 } from "@/modules/bank-coordination/bank-coordination.types";
import { patchBankCoordination } from "@/modules/bank-coordination/bank-coordination.service";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const gate = await loadDealForCoordination(dealId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
  if (!canMutateCoordination(gate)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const flags = await coordinationFlags();
  if (!flags.bankCoordinationV1) return Response.json({ error: "Disabled" }, { status: 403 });

  let body: {
    financingStatus?: DealFinancingCoordinationStatus;
    institutionName?: string | null;
    lastContactAt?: string | null;
    lenderMetadata?: LenderMetadataV1;
    missingInfoFlags?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const row = await patchBankCoordination(
    dealId,
    {
      financingStatus: body.financingStatus,
      institutionName: body.institutionName,
      lastContactAt: body.lastContactAt ? new Date(body.lastContactAt) : body.lastContactAt === null ? null : undefined,
      lenderMetadata: body.lenderMetadata,
      missingInfoFlags: body.missingInfoFlags,
    },
    userId
  );
  return Response.json({ coordination: row });
}
