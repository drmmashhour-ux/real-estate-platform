import { NextResponse } from "next/server";
import { generateListingTrustScore } from "@/src/modules/bnhub/application/trustService";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });
  try {
    const trust = await generateListingTrustScore(listingId);
    return NextResponse.json(trust);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

