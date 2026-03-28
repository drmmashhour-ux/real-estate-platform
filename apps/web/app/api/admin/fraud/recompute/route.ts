import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  processListingFraudQueue,
  processReviewFraudQueue,
  recomputeFraudScores,
} from "@/src/workers/fraudDetectionWorker";

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const mode = (body.mode as string) || "all";
  const limit = typeof body.limit === "number" ? body.limit : 40;

  let listings = 0;
  let reviews = 0;
  let scores = 0;

  if (mode === "all" || mode === "listings") {
    listings = await processListingFraudQueue(Math.min(200, limit));
  }
  if (mode === "all" || mode === "reviews") {
    reviews = await processReviewFraudQueue(Math.min(200, limit));
  }
  if (mode === "all" || mode === "scores") {
    scores = await recomputeFraudScores(Math.min(500, limit * 2));
  }

  return Response.json({ ok: true, listings, reviews, scores });
}
