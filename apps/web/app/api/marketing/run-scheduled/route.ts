import { NextRequest } from "next/server";
import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { marketingRunScheduledBodySchema } from "@/lib/ai-marketing/schemas";
import { marketingJsonError, marketingJsonOk } from "@/lib/marketing/http-response";
import { runDueMarketingPublishes } from "@/lib/marketing-publish/run-scheduled";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = await requireAdminSurfaceApi();
  if (denied) return denied;

  let json: unknown = {};
  try {
    json = await request.json();
  } catch {
    json = {};
  }

  const parsed = marketingRunScheduledBodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return marketingJsonError(400, "Invalid input", "VALIDATION_ERROR");
  }

  try {
    const out = await runDueMarketingPublishes({
      limit: parsed.data.limit,
      cronLiveOnly: parsed.data.cronLiveOnly === true,
    });
    return marketingJsonOk({
      picked: out.picked,
      results: out.results.map((r) => ({
        ok: r.ok,
        code: r.code ?? null,
        error: r.error ?? null,
        jobId: r.jobId ?? null,
        contentStatus: r.contentStatus ?? null,
        executedDryRun: r.executedDryRun ?? null,
      })),
    });
  } catch (e) {
    console.error("[api/marketing/run-scheduled]", e);
    return marketingJsonError(500, "Internal error", "INTERNAL");
  }
}
