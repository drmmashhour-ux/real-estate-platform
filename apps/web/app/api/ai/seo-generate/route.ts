import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { generateSeoFromData } from "@/modules/ai-core/application/seoEngineService";
import { storeFeedbackSignal } from "@/modules/ai-training/application/storeFeedbackSignal";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const type = body?.type;
  if (type === "listing") {
    const listingId = typeof body?.listingId === "string" ? body.listingId : "";
    if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    const out = await generateSeoFromData(prisma, { type: "listing", listingId });
    if (!out) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    await storeFeedbackSignal(prisma, {
      subsystem: "seo",
      entityType: "listing",
      entityId: listingId,
      promptOrQuery: "auto:seo-generate-listing",
      outputSummary: out.title,
      metadata: { keywords: out.keywords.slice(0, 8) },
    }).catch(() => {});
    return NextResponse.json(out);
  }
  if (type === "area") {
    const city = typeof body?.city === "string" ? body.city : "";
    if (!city.trim()) return NextResponse.json({ error: "city is required" }, { status: 400 });
    const out = await generateSeoFromData(prisma, { type: "area", city });
    if (!out) return NextResponse.json({ error: "Unable to generate area SEO" }, { status: 400 });
    await storeFeedbackSignal(prisma, {
      subsystem: "seo",
      entityType: "area",
      entityId: city,
      promptOrQuery: "auto:seo-generate-area",
      outputSummary: out.title,
      metadata: { keywords: out.keywords.slice(0, 8) },
    }).catch(() => {});
    return NextResponse.json(out);
  }
  if (type === "blog") {
    const city = typeof body?.city === "string" ? body.city : "";
    const topic = typeof body?.topic === "string" ? body.topic : undefined;
    if (!city.trim()) return NextResponse.json({ error: "city is required" }, { status: 400 });
    const out = await generateSeoFromData(prisma, { type: "blog", city, topic });
    if (!out) return NextResponse.json({ error: "Unable to generate blog SEO" }, { status: 400 });
    await storeFeedbackSignal(prisma, {
      subsystem: "seo",
      entityType: "blog",
      entityId: `${city}:${topic ?? "top deals today"}`,
      promptOrQuery: "auto:seo-generate-blog",
      outputSummary: out.title,
      metadata: { keywords: out.keywords.slice(0, 8) },
    }).catch(() => {});
    return NextResponse.json(out);
  }
  return NextResponse.json({ error: "Invalid type. Use listing|area|blog" }, { status: 400 });
}
