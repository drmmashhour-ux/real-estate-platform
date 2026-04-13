import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canMutateCoordination, loadDealForCoordination } from "@/lib/deals/coordination-access";
import { coordinationFlags } from "@/lib/deals/coordination-feature-flags";

export const dynamic = "force-dynamic";

/**
 * Placeholder for future provider-backed send. v1: always requires explicit broker action outside LECIPM
 * unless FEATURE_COORDINATION_LIVE_EMAIL is enabled (still broker-triggered).
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const gate = await loadDealForCoordination(dealId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
  if (!canMutateCoordination(gate)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const flags = await coordinationFlags();
  if (!flags.requestCommunicationsV1) return Response.json({ error: "Disabled" }, { status: 403 });

  let body: { communicationId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.communicationId) return Response.json({ error: "communicationId required" }, { status: 400 });

  if (!flags.liveOutboundEmail) {
    return Response.json({
      ok: false,
      mode: "draft_only",
      message:
        "Live send is disabled. Copy the draft from communications logs or enable FEATURE_COORDINATION_LIVE_EMAIL with a configured provider.",
    });
  }

  return Response.json({
    ok: false,
    mode: "not_configured",
    message: "Live email provider not wired in v1 — use draft + external CRM.",
  });
}
