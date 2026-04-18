import { NextResponse } from "next/server";
import { z } from "zod";
import { revenueV4Flags } from "@/config/feature-flags";
import { generateGtmScript } from "@/modules/gtm/script-generator.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  segment: z.enum(["host_bnhub", "broker", "seller", "buyer", "investor"]),
  channel: z.enum(["short_pitch", "long_pitch", "dm", "email", "call"]),
  market: z.string().max(120).optional(),
  bullets: z.array(z.string().max(400)).max(8).optional(),
});

export async function POST(req: Request) {
  if (!revenueV4Flags.gtmEngineV1) {
    return NextResponse.json({ error: "GTM engine disabled" }, { status: 403 });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`gtm:script:${ip}`, { windowMs: 60_000, max: 30 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const script = generateGtmScript(parsed.data);
  const uid = await getGuestId();
  await logGrowthEngineAudit({
    actorUserId: uid,
    action: "gtm_script_generated",
    payload: { segment: parsed.data.segment, channel: parsed.data.channel },
  });

  return NextResponse.json({ ok: true, script });
}
