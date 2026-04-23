import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDealCandidateSummary } from "@/lib/deal/ai-summary";
import { prisma } from "@/lib/db";
import { assertDealFinderDataLayerEnabled } from "@/lib/deal/safety";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
});

export async function POST(req: Request) {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  let json: unknown = {};
  try {
    json = await req.json();
  } catch {
    json = {};
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    assertDealFinderDataLayerEnabled();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DATA_SOURCE_REQUIRED";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const limit = parsed.data.limit ?? 20;

  const candidates = await prisma.dealCandidate.findMany({
    orderBy: { dealScore: "desc" },
    take: limit,
  });

  const updated = [];
  for (const c of candidates) {
    try {
      updated.push(await generateDealCandidateSummary(c.id));
    } catch {
      // Skip rows that fail metric gates without failing the whole batch
    }
  }

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "DEAL_FINDER_SUMMARIES_GENERATED",
    payload: { requested: candidates.length, completed: updated.length },
  });

  return NextResponse.json({ success: true, items: updated });
}
