import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { loadDealForCoordination } from "@/lib/deals/coordination-access";
import { coordinationFlags } from "@/lib/deals/coordination-feature-flags";
import { getBankCoordination } from "@/modules/bank-coordination/bank-coordination.service";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const gate = await loadDealForCoordination(dealId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  const flags = await coordinationFlags();
  if (!flags.bankCoordinationV1) {
    return Response.json({ error: "Bank coordination disabled" }, { status: 403 });
  }

  const data = await getBankCoordination(dealId);
  return Response.json({
    ...data,
    disclaimer:
      "LECIPM is not a lender. Financing status is tracked for coordination only; decisions rest with the lender and parties.",
  });
}
