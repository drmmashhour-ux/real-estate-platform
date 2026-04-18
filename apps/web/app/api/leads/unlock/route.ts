import { NextResponse } from "next/server";
import { leadMonetizationFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";
import { initiateLeadUnlockCheckout } from "@/modules/leads/lead-monetization.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/leads/unlock — body `{ "leadId": "..." }` — same Stripe checkout as `/api/leads/[id]/unlock-checkout`.
 * Gated by `FEATURE_LEAD_MONETIZATION_V1` (returns 404 when off so legacy paths stay primary).
 */
export async function POST(req: Request): Promise<NextResponse> {
  if (!leadMonetizationFlags.leadMonetizationV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }

  let body: { leadId?: string };
  try {
    body = (await req.json()) as { leadId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadId = body.leadId?.trim();
  if (!leadId) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const rl = checkRateLimit(`lead:unlock:${userId}`, { windowMs: 60_000, max: 10 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(rl) },
    );
  }

  try {
    const result = await initiateLeadUnlockCheckout({ userId, leadId, recordMonetizationAttempt: true });
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
    logError("lead_unlock_api_failed", { leadId, userId, err: e });
    return NextResponse.json({ error: "Checkout unavailable" }, { status: 502 });
  }
}
