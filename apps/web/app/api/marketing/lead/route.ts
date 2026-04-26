import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { recordPlatformEvent } from "@/lib/observability";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().max(160).optional(),
  role: z.string().trim().max(64).optional(),
});

/**
 * POST /api/marketing/lead — landing page lead capture (name, email, role).
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`marketing-lead:${ip}`, { max: 15, windowMs: 86_400_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again tomorrow." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const { email, name, role } = parsed.data;
  const referrer = req.headers.get("referer")?.slice(0, 512) ?? null;

  try {
    await prisma.earlyAccessSubscriber.upsert({
      where: { email: email.toLowerCase() },
      create: {
        email: email.toLowerCase(),
        name,
        role: role || undefined,
        source: "marketing_lead",
        referrer,
      },
      update: {
        name,
        role: role ?? undefined,
        referrer: referrer ?? undefined,
        source: "marketing_lead",
      },
    });
    void recordPlatformEvent({
      eventType: "marketing_lead_submitted",
      sourceModule: "marketing",
      entityType: "EarlyAccessSubscriber",
      entityId: email.toLowerCase(),
      payload: { name, role: role ?? null },
    }).catch(() => {});
  } catch (e) {
    console.error("[marketing/lead]", e);
    return NextResponse.json({ ok: false, error: "Could not save. Try again later." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
