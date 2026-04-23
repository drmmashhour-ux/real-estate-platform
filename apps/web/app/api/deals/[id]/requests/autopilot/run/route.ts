import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canMutateCoordination, loadDealForCoordination } from "@/lib/deals/coordination-access";
import { coordinationFlags } from "@/lib/deals/coordination-feature-flags";
import { runDocumentRequestAutopilot } from "@/modules/document-request-autopilot/document-request-autopilot.service";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const gate = await loadDealForCoordination(dealId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
  if (!canMutateCoordination(gate)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const flags = await coordinationFlags();
  if (!flags.documentRequestAutopilotV1) {
    return Response.json({ error: "Autopilot disabled" }, { status: 403 });
  }

  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { status: true } });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const result = await runDocumentRequestAutopilot(dealId, deal.status, userId);
  return Response.json(result);
}
