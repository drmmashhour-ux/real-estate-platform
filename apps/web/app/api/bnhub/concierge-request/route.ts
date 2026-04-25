import { NextRequest } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { captureGrowthLead } from "@/modules/lead-gen/lead-capture.service";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(200),
  message: z.string().min(8).max(8000),
  sessionId: z.string().max(128).optional(),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`bnhub_concierge:${ip}`, { max: 10, windowMs: 60_000 });
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

  const guestId = await getGuestId().catch(() => null);
  await captureGrowthLead({
    name: "BNHub concierge",
    email: parsed.data.email,
    phone: "—",
    message: parsed.data.message,
    intentCategory: "renter",
    source: "bnhub_concierge",
    campaign: "ethical_seeding_concierge",
    medium: "product",
    referrerUrl: req.headers.get("referer"),
    leadSource: "bnhub_concierge_form",
    userId: guestId,
  });

  return Response.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
