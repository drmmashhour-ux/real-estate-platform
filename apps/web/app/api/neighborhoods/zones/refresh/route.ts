import { NextResponse } from "next/server";
import { z } from "zod";
import { rebuildInvestmentZoneSnapshots } from "@/lib/neighborhood/zones";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  city: z.string().min(1),
  province: z.string().max(8).optional(),
});

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

  const province = parsed.data.province ?? "QC";
  await rebuildInvestmentZoneSnapshots(parsed.data.city, province);

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "INVESTMENT_ZONE_SNAPSHOTS_REFRESHED",
    payload: { city: parsed.data.city, province },
  });

  return NextResponse.json({ success: true });
}
