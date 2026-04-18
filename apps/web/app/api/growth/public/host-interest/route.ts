import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { captureGrowthLead } from "@/modules/lead-gen/lead-capture.service";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(40).optional(),
  propertyType: z.string().max(64).optional(),
  message: z.string().max(2000).optional(),
});

/** Public host acquisition — `Lead` row + growth tagging (no feature flag gate). */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`growth:host_interest:${ip}`, { windowMs: 60_000, max: 15 });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
  const b = parsed.data;
  const userId = await getGuestId().catch(() => null);
  const msg =
    b.message?.trim() ||
    `Host join interest · property type: ${b.propertyType?.trim() || "unspecified"} · source: /host/join`;

  const result = await captureGrowthLead({
    name: b.name.trim(),
    email: b.email.trim().toLowerCase(),
    phone: (b.phone?.trim() || "not-provided").slice(0, 40),
    message: msg.slice(0, 8000),
    intentCategory: "host",
    source: "host_join_page",
    campaign: "lecipm_host_join_v1",
    medium: "organic",
    referrerUrl: typeof req.headers.get === "function" ? req.headers.get("referer") : null,
    userId,
    leadSource: "host_join_public",
  });

  return NextResponse.json({ ok: true, leadId: result.id, duplicate: result.duplicate });
}
