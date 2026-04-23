import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { analyzeListingWithAiCore } from "@/modules/ai-core/application/listingAnalysisAI";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }
  const insight = await analyzeListingWithAiCore(prisma, listingId);
  if (!insight) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  return NextResponse.json(insight);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = typeof body?.listingId === "string" ? body.listingId : "";
  if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  const insight = await analyzeListingWithAiCore(prisma, listingId);
  if (!insight) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  return NextResponse.json(insight);
}
