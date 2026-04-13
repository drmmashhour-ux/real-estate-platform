import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logRecommendationEngagement } from "@/lib/recommendations/recommendation-events";
import type { RecommendationWidgetSource } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    listingIds?: string[];
    widget?: string;
    source?: RecommendationWidgetSource;
    listingKind?: "bnhub" | "fsbo";
    event?: "impression" | "click";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingIds = Array.isArray(body.listingIds) ? body.listingIds.filter((x) => typeof x === "string") : [];
  const widget = typeof body.widget === "string" ? body.widget : "unknown";
  const source = (body.source ?? "personalized") as RecommendationWidgetSource;
  const listingKind = body.listingKind === "fsbo" ? "fsbo" : "bnhub";
  const event = body.event === "click" ? "click" : "impression";

  const userId = await getGuestId();

  await Promise.all(
    listingIds.slice(0, 24).map((listingId) =>
      logRecommendationEngagement({
        userId,
        listingId,
        widget,
        source,
        listingKind,
        event,
      })
    )
  );

  return NextResponse.json({ ok: true });
}
