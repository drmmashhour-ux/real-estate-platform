import type { NextRequest } from "next/server";
import { scheduleBodySchema } from "@/lib/ai-marketing/schemas";
import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { getContent, scheduleContent } from "@/lib/marketing/marketing-content-service";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";

/**
 * Shared POST handler for scheduling (used by `/api/marketing/schedule` and legacy `/api/ai/schedule`).
 */
export async function handleMarketingSchedulePost(request: NextRequest): Promise<Response> {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return marketingJsonError(400, "Invalid JSON", "INVALID_JSON");
  }

  const parsed = scheduleBodySchema.safeParse(json);
  if (!parsed.success) {
    return marketingJsonError(400, "Invalid input", "VALIDATION_ERROR");
  }

  try {
    const { contentId, scheduledAt } = parsed.data;
    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime())) {
      return marketingJsonError(400, "Invalid scheduledAt", "INVALID_DATETIME");
    }

    const existing = await getContent(contentId);
    if (!existing) {
      return marketingJsonError(404, "Not found", "NOT_FOUND");
    }

    if (existing.status !== "APPROVED" && existing.status !== "SCHEDULED") {
      return marketingJsonError(
        400,
        "Content must be approved (or already scheduled) before setting a schedule",
        "INVALID_STATE"
      );
    }

    const row = await scheduleContent(contentId, when);

    return marketingJsonOk({
      id: row.id,
      status: row.status,
      scheduledAt: when.toISOString(),
    });
  } catch (e) {
    console.error("[marketing schedule]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
