import { NextRequest } from "next/server";
import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { marketingPublishBodySchema } from "@/lib/ai-marketing/schemas";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";
import { publishMarketingContent } from "@/lib/marketing-publish/publish-content";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return marketingJsonError(400, "Invalid JSON", "INVALID_JSON");
  }

  const parsed = marketingPublishBodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return marketingJsonError(400, "Invalid input", "VALIDATION_ERROR");
  }

  try {
    const result = await publishMarketingContent({
      contentId: parsed.data.contentId,
      channel: parsed.data.channel,
      dryRun: parsed.data.dryRun,
      mode: "immediate",
    });

    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "NOT_ELIGIBLE" || result.code === "NEED_CHANNEL"
            ? 400
            : 422;
      return marketingJsonError(status, result.error ?? "Publish failed", result.code);
    }

    return marketingJsonOk({
      jobId: result.jobId,
      contentStatus: result.contentStatus,
      executedDryRun: result.executedDryRun,
      summary: result.summary ?? null,
      externalPostId: result.externalPostId ?? null,
    });
  } catch (e) {
    console.error("[api/marketing/publish]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
