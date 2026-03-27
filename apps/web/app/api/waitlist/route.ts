import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { recordTrafficEventServer } from "@/lib/traffic/record-server-event";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(320),
  source: z.string().max(64).optional(),
  sessionId: z.string().max(64).optional(),
  /** Shared deal page — links waitlist to originating deal */
  dealId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`waitlist:${ip}`, { max: 20, windowMs: 86_400_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests." },
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
    return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const source = parsed.data.source?.trim() || "homepage";
  const sessionId = parsed.data.sessionId?.trim().slice(0, 64) ?? null;
  const dealId = parsed.data.dealId ?? null;

  try {
    const existing = await prisma.waitlistUser.findUnique({ where: { email } });
    const prevTags = Array.isArray(existing?.tags) ? [...(existing.tags as string[])] : [];
    const hadEarly = prevTags.includes("early_user");
    const tags = hadEarly ? prevTags : [...prevTags, "early_user"];

    await prisma.waitlistUser.upsert({
      where: { email },
      create: {
        email,
        tags,
        earlyUserTaggedAt: new Date(),
      },
      update: {
        tags,
        ...(!hadEarly ? { earlyUserTaggedAt: new Date() } : {}),
      },
    });
  } catch (e) {
    console.error("[waitlist]", e);
    return NextResponse.json({ ok: false, error: "Could not save email." }, { status: 500 });
  }

  await recordTrafficEventServer({
    eventType: "growth_waitlist_signup",
    path: null,
    meta: {
      source,
      emailDomain: email.split("@")[1] ?? "",
      ...(dealId ? { dealId } : {}),
    },
    sessionId,
    headers: req.headers,
    body: parsed.data,
  });

  return NextResponse.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
