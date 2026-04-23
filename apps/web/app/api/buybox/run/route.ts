import { NextResponse } from "next/server";
import { z } from "zod";
import { runBuyBoxMatch } from "@/lib/buybox/matcher";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  buyBoxId: z.string().min(1),
});

function mapErr(e: unknown): Response {
  if (!(e instanceof Error)) {
    return NextResponse.json({ error: "UNKNOWN" }, { status: 500 });
  }
  if (e.message === "DATA_SOURCE_REQUIRED") {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  if (e.message === "BUY_BOX_NOT_FOUND") {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
  if (e.message === "DEAL_METRICS_REQUIRED") {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  return NextResponse.json({ error: e.message }, { status: 500 });
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

  try {
    const items = await runBuyBoxMatch(parsed.data.buyBoxId, ctx.owner.ownerType, ctx.owner.ownerId);
    await recordAuditEvent({
      actorUserId: ctx.userId,
      action: "BUY_BOX_MATCH_RUN",
      payload: { buyBoxId: parsed.data.buyBoxId, matchCount: items.length },
    });
    return NextResponse.json({ success: true, items });
  } catch (e) {
    return mapErr(e);
  }
}
