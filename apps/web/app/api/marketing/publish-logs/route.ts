import { NextRequest } from "next/server";
import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  const contentId = request.nextUrl.searchParams.get("contentId")?.trim();
  if (!contentId) {
    return marketingJsonError(400, "contentId query required", "VALIDATION_ERROR");
  }

  try {
    const rows = await prisma.marketingPublishJob.findMany({
      where: { contentId },
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    return marketingJsonOk({
      items: rows.map((j) => ({
        id: j.id,
        channel: j.channel,
        status: j.status,
        scheduledAt: j.scheduledAt?.toISOString() ?? null,
        startedAt: j.startedAt?.toISOString() ?? null,
        finishedAt: j.finishedAt?.toISOString() ?? null,
        externalPostId: j.externalPostId,
        errorMessage: j.errorMessage,
        responseSummary: j.responseSummary,
        dryRun: j.dryRun,
        createdAt: j.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[api/marketing/publish-logs]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
