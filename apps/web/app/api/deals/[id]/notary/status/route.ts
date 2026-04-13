import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canMutateCoordination, loadDealForCoordination } from "@/lib/deals/coordination-access";
import { coordinationFlags } from "@/lib/deals/coordination-feature-flags";
import { patchNotaryCoordination } from "@/modules/notary-coordination/notary-coordination.service";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const gate = await loadDealForCoordination(dealId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
  if (!canMutateCoordination(gate)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const flags = await coordinationFlags();
  if (!flags.notaryCoordinationHubV1) return Response.json({ error: "Disabled" }, { status: 403 });

  let body: { packageStatus?: string; deedReadinessNotes?: string | null; notaryFirmName?: string | null; metadata?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const row = await patchNotaryCoordination(dealId, body, userId);
  return Response.json({ coordination: row });
}
