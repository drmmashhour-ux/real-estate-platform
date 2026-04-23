import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { triggerAiSalesAgent } from "@/modules/ai-sales-agent/ai-sales-orchestrator.service";

export const dynamic = "force-dynamic";

/**
 * POST body: `{ leadId, trigger?: "user_requests_info" | "follow_up_timing" }`
 * Broker or admin may re-trigger assistant flows (assistive; respects mode + consent).
 */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  const trigger =
    body.trigger === "follow_up_timing"
      ? ("follow_up_timing" as const)
      : ("user_requests_info" as const);

  if (!leadId) return Response.json({ error: "leadId required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      introducedByBrokerId: true,
      email: true,
      optedOutOfFollowUp: true,
    },
  });

  if (!lead) return Response.json({ error: "Not found" }, { status: 404 });

  const isAdmin = user?.role === "ADMIN";
  const isOwningBroker = lead.introducedByBrokerId === userId;

  if (!isAdmin && !isOwningBroker) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await triggerAiSalesAgent({
    leadId,
    trigger,
    consentMarketing: !lead.optedOutOfFollowUp,
    consentPrivacy: true,
  });

  return Response.json({ ok: true });
}
