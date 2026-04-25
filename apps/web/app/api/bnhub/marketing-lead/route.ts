import { NextRequest } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { getGuestId } from "@/lib/auth/session";
import { captureGrowthLead } from "@/modules/lead-gen/lead-capture.service";
import { GrowthEventName } from "@/modules/growth/event-types";
import { recordGrowthEvent } from "@/modules/growth/tracking.service";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(200),
  city: z.enum(["montreal", "laval", "other"]).optional(),
  referralCode: z.string().max(32).optional(),
  sessionId: z.string().max(128).optional(),
});

export async function POST(req: NextRequest) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  const rl = checkRateLimit(`bnhub_marketing_lead:${ip}`, { max: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }

  const { email, city, referralCode, sessionId } = parsed.data;
  const cityLabel =
    city === "montreal" ? "Montréal" : city === "laval" ? "Laval" : city === "other" ? "Other" : "—";

  const messageParts = [
    "BNHub marketing landing — Get updates / deals",
    `Preferred area: ${cityLabel}`,
  ];
  if (referralCode?.trim()) messageParts.push(`Referral hint: ${referralCode.trim()}`);

  const result = await captureGrowthLead({
    name: "BNHub updates subscriber",
    email,
    phone: "—",
    message: messageParts.join(" · "),
    intentCategory: "renter",
    source: "bnhub_marketing_landing",
    campaign: "bnhub_first100",
    medium: "organic",
    referrerUrl: req.headers.get("referer"),
    leadSource: "bnhub_landing",
    userId: null,
  });

  if (!result.duplicate) {
    const guestId = await getGuestId().catch(() => null);
    void recordGrowthEvent({
      eventName: GrowthEventName.LEAD_CAPTURE,
      userId: guestId,
      sessionId: sessionId?.slice(0, 64) ?? null,
      idempotencyKey: `bnhub_ml:${result.id}`.slice(0, 160),
      metadata: {
        leadId: result.id,
        surface: "bnhub_marketing_landing",
        campaign: "bnhub_first100",
        city: city ?? null,
        referralCode: referralCode?.trim() || null,
      },
      cookieHeader: req.headers.get("cookie"),
      body: parsed.data,
      pageUrl: req.url,
      referrerHeader: req.headers.get("referer"),
    }).catch(() => {});
  }

  return Response.json(
    { ok: true, id: result.id, duplicate: result.duplicate },
    { headers: getRateLimitHeaders(rl) }
  );
}
