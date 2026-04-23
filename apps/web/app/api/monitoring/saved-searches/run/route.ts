import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { getSavedSearchForOwner } from "@/lib/monitoring/saved-searches";
import { runSavedSearch } from "@/lib/monitoring/run-saved-search";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  savedSearchId: z.string().min(1),
});

function mapErr(e: unknown): Response {
  if (!(e instanceof Error)) {
    return NextResponse.json({ error: "UNKNOWN" }, { status: 500 });
  }
  switch (e.message) {
    case "DATA_SOURCE_REQUIRED":
      return NextResponse.json({ error: e.message }, { status: 403 });
    case "SAVED_SEARCH_NOT_FOUND":
      return NextResponse.json({ error: e.message }, { status: 404 });
    case "GUARANTEED_OUTCOME_LANGUAGE_FORBIDDEN":
    case "HUMAN_REVIEW_REQUIRED":
      return NextResponse.json({ error: e.message }, { status: 400 });
    default:
      return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const owned = await getSavedSearchForOwner(
    parsed.data.savedSearchId,
    ctx.owner.ownerType,
    ctx.owner.ownerId,
  );
  if (!owned) {
    return NextResponse.json({ error: "SAVED_SEARCH_NOT_FOUND" }, { status: 404 });
  }

  try {
    const result = await runSavedSearch(parsed.data.savedSearchId);
    await recordAuditEvent({
      actorUserId: ctx.userId,
      action: "MONITORING_SAVED_SEARCH_RUN",
      payload: {
        savedSearchId: parsed.data.savedSearchId,
        runId: result.run.id,
        resultCount: result.run.resultCount,
        newResultCount: result.run.newResultCount,
      },
    });
    return NextResponse.json({ success: true, result });
  } catch (e) {
    return mapErr(e);
  }
}
