import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { engineFlags } from "@/config/feature-flags";
import { createHostAcquisitionLead } from "@/src/modules/growth/hostAcquisitionLead";
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().min(1).max(120),
  propertyCategory: z.string().trim().min(1).max(80),
  source: z.enum(["airbnb", "direct", "referral", "other"]),
  notes: z.string().max(4000).optional(),
  listingUrl: z.string().url().max(2048).optional(),
});

/**
 * POST /api/leads/create — host supply acquisition (ListingAcquisitionLead). Public; rate-limited.
 */
export async function POST(req: Request) {
  if (!engineFlags.hostAcquisitionV1) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const rl = checkRateLimit(`growth:host_lead:${ip}`, { windowMs: 3600_000, max: 20 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many submissions" },
      { status: 429, headers: getRateLimitHeaders(rl) },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const row = await createHostAcquisitionLead({
    contactName: parsed.data.name,
    contactEmail: parsed.data.email,
    contactPhone: parsed.data.phone,
    city: parsed.data.city,
    propertyCategory: parsed.data.propertyCategory,
    source: parsed.data.source,
    notes: parsed.data.notes,
    sourceListingUrl: parsed.data.listingUrl,
  });

  void trackFunnelEvent("lead_created", {
    kind: "host_acquisition",
    leadId: row.id,
    source: parsed.data.source,
  });

  return NextResponse.json({ ok: true, id: row.id });
}
