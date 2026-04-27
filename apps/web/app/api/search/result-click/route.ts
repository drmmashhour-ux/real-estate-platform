import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics/tracker";

const bodySchema = z.object({
  listingId: z.string().min(1),
  rankingScore: z.number().optional(),
  /** Order 82.1 — personalization layer contribution when known. */
  boostScore: z.number().optional(),
});

/**
 * Order 82 — client posts when a search result row is opened (for funnel + ranking analytics).
 */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }
  const { listingId, rankingScore, boostScore } = parsed.data;
  void trackEvent("search_result_clicked", {
    listingId,
    ...(rankingScore != null && Number.isFinite(rankingScore) ? { rankingScore } : {}),
  });
  if (boostScore != null && Number.isFinite(boostScore)) {
    void trackEvent("personalization_click", { listingId, boostScore });
  }
  return NextResponse.json({ ok: true });
}
