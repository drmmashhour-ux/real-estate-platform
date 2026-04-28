import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";
import { initiateLeadUnlockCheckout } from "@/modules/leads/lead-monetization.service";
import { assignLeadFromCrmLeadId } from "@/modules/brokers/broker-leads.service";
import { maybeBlockRequestWithLegalGate } from "@/modules/legal/legal-api-gate";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

/**
 * POST /api/lecipm/leads/[id]/unlock-checkout — broker pays to reveal CRM contact fields (Stripe `lead_unlock`).
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const railBlock = requireCheckoutRailsOpen();
  if (railBlock) return railBlock;

  const { id: leadId } = await context.params;
  if (!leadId?.trim()) {
    return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const rl = checkRateLimit(`lead:unlock-checkout:${userId}`, { windowMs: 60_000, max: 10 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(rl) },
    );
  }

  try {
    const legalGate = await maybeBlockRequestWithLegalGate({
      action: "unlock_contact",
      userId,
      actorType: "broker",
    });
    if (legalGate) return legalGate;

    void assignLeadFromCrmLeadId(leadId).catch(() => {});
    const result = await initiateLeadUnlockCheckout({ userId, leadId, recordMonetizationAttempt: false });
    if (!result.ok) {
      if (result.softBlock) {
        return NextResponse.json({
          softBlock: true,
          message: result.message,
          cta: "Unlock Lead",
          reason: result.reason ?? "not_paid",
        });
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      url: result.url,
      sessionId: result.sessionId,
      amountCents: result.amountCents,
      pricing: result.pricing,
    });
  } catch (e) {
    logError("lead_unlock_checkout_failed", { leadId, userId, err: e });
    return NextResponse.json({ error: "Checkout unavailable" }, { status: 502 });
  }
}
