import { NextRequest } from "next/server";
import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { marketingTrackBodySchema } from "@/lib/ai-marketing/schemas";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";
import { getContent, trackMetrics } from "@/lib/marketing/marketing-content-service";

export const dynamic = "force-dynamic";

/**
 * Manual metric snapshots (append-only).
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return marketingJsonError(400, "Invalid JSON", "INVALID_JSON");
  }

  const parsed = marketingTrackBodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    return marketingJsonError(400, msg, "VALIDATION_ERROR");
  }

  try {
    const { contentId, views, clicks, conversions, opens, notes } = parsed.data;
    const content = await getContent(contentId);
    if (!content) {
      return marketingJsonError(404, "Not found", "NOT_FOUND");
    }

    const row = await trackMetrics({
      contentId,
      views: views ?? null,
      clicks: clicks ?? null,
      conversions: conversions ?? null,
      opens: opens ?? null,
      notes: notes?.trim() || null,
    });

    return marketingJsonOk({
      metricId: row.id,
      recordedAt: row.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("[api/marketing/track]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
