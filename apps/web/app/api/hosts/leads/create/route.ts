import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { hostEconomicsFlags } from "@/config/feature-flags";
import { createHostLeadSchema } from "@/modules/host-onboarding/onboarding.validation";
import { createHostLead } from "@/modules/host-onboarding/onboarding.service";
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import { logHostFunnelEvent } from "@/lib/host-funnel/logger";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/** POST /api/hosts/leads/create */
export async function POST(req: Request) {
  if (!hostEconomicsFlags.hostOnboardingFunnelV1) {
    return NextResponse.json({ ok: false, error: "Feature disabled" }, { status: 403 });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`host:lead:${ip}`, { windowMs: 60_000, max: 20 });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createHostLeadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const b = parsed.data;
  if (!b.email && !b.phone) {
    return NextResponse.json({ ok: false, error: "Provide at least email or phone" }, { status: 400 });
  }

  const userId = await getGuestId();
  try {
    const lead = await createHostLead({
      ...b,
      userId: userId ?? undefined,
    });
    logHostFunnelEvent("host_lead_created", { leadId: lead.id });
    void trackFunnelEvent("host_lead_created", { source: lead.source });
    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (e) {
    console.error("host lead create", e);
    return NextResponse.json({ ok: false, error: "Could not save lead" }, { status: 500 });
  }
}
