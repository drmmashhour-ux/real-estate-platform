import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EarlyUserTrackingType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(320),
  phone: z.string().max(64).optional().nullable(),
  intent: z.enum(["host", "guest", "HOST", "GUEST"]),
  source: z.string().max(64).optional(),
  utmSource: z.string().max(128).optional(),
  utmMedium: z.string().max(64).optional(),
  utmCampaign: z.string().max(128).optional(),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`growth-lead:${ip}`, { max: 30, windowMs: 86_400_000 });
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
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const intentRaw = parsed.data.intent.toUpperCase();
  const intent =
    intentRaw === "HOST" ? EarlyUserTrackingType.HOST : EarlyUserTrackingType.GUEST;
  const phone = parsed.data.phone?.trim() || null;
  const source = parsed.data.source?.trim().slice(0, 64) || "early_access_lp";
  const utmSource = parsed.data.utmSource?.trim().slice(0, 128) || null;
  const utmMedium = parsed.data.utmMedium?.trim().slice(0, 64) || null;
  const utmCampaign = parsed.data.utmCampaign?.trim().slice(0, 128) || null;

  try {
    await prisma.growthLeadCapture.create({
      data: {
        email,
        phone,
        intent,
        source,
        utmSource,
        utmMedium,
        utmCampaign,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[growth/lead-capture]", e);
    return NextResponse.json({ ok: false, error: "Could not save." }, { status: 500 });
  }
}
