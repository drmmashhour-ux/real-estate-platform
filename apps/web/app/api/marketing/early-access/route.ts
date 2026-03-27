import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().email().max(320),
  source: z.string().trim().max(64).optional(),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`early-access:${ip}`, { max: 20, windowMs: 86_400_000 });
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

  const { email, source } = parsed.data;
  const referrer = req.headers.get("referer")?.slice(0, 512) ?? null;

  try {
    await prisma.earlyAccessSubscriber.upsert({
      where: { email: email.toLowerCase() },
      create: {
        email: email.toLowerCase(),
        source: source ?? "homepage",
        referrer,
      },
      update: {
        referrer: referrer ?? undefined,
      },
    });
  } catch (e) {
    console.error("[early-access]", e);
    return NextResponse.json({ ok: false, error: "Could not save. Try again later." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
