import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { createLeadHubVisitor } from "@/lib/growth/lead-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(320),
  name: z.string().max(200).optional().nullable(),
  phone: z.string().max(64).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  brokerRoute: z.enum(["real_estate", "mortgage", "both"]),
  leadUrgency: z.enum(["hot", "mid", "long_term"]),
  propertySegment: z.enum(["residential", "multiplex", "commercial", "land"]).optional(),
  consent: z.literal(true),
  sourcePage: z.string().max(64).optional(),
});

const SEGMENT_LABEL: Record<string, string> = {
  residential: "Residential",
  multiplex: "Multiplex",
  commercial: "Commercial",
  land: "Lot / land",
};

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const limit = checkRateLimit(`leads-hub:${ip}`, { windowMs: 86_400_000, max: 40 });
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429, headers: getRateLimitHeaders(limit) });
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

  const d = parsed.data;
  const segmentLabel = d.propertySegment ? SEGMENT_LABEL[d.propertySegment] ?? d.propertySegment : null;

  try {
    await createLeadHubVisitor({
      email: d.email,
      name: d.name,
      phone: d.phone,
      city: d.city,
      brokerRoute: d.brokerRoute,
      leadUrgency: d.leadUrgency,
      propertySegmentLabel: segmentLabel,
      sourcePage: d.sourcePage?.trim() || "list_your_property",
    });
    return NextResponse.json({ ok: true }, { status: 201, headers: getRateLimitHeaders(limit) });
  } catch (e) {
    console.error("[leads/hub-capture]", e);
    return NextResponse.json({ ok: false, error: "Could not save." }, { status: 500 });
  }
}
