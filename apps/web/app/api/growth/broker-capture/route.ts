import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { captureGrowthLead } from "@/modules/lead-gen/lead-capture.service";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public broker-interest capture for marketing landings.
 * Product note: `next.config` rewrites `/api/leads` → `/api/lecipm/leads`, so this is the **stable** public URL for the same
 * data model (`POST` → `source: broker_signup`, `Lead.growthTag: broker_interest`, email, phone).
 */
const bodySchema = z.object({
  email: z.string().email(),
  phone: z.string().min(5).max(40),
  name: z.string().min(1).max(200).optional(),
  source: z.string().optional(),
  tag: z.string().optional(),
});

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "local";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = checkRateLimit(`growth:broker_signup:${ip}`, { windowMs: 60_000, max: 20 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many submissions — try again shortly." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().formErrors.join("; ") }, { status: 400 });
  }

  const { email, phone, name } = parsed.data;
  try {
    const result = await captureGrowthLead({
      name: name?.trim() || "Broker interest",
      email,
      phone,
      message: "Broker signup / interest — contact me about LECIPM for brokers.",
      intentCategory: "broker",
      source: "broker_signup",
      growthTag: "broker_interest",
      leadSource: "broker_landing",
    });
    return NextResponse.json(
      { ok: true, id: result.id, duplicate: result.duplicate },
      { headers: getRateLimitHeaders(rl) }
    );
  } catch (e) {
    console.error("[api/growth/broker-capture] failed:", e);
    return NextResponse.json({ error: "Could not save lead" }, { status: 500 });
  }
}
