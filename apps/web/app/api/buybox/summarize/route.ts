import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateBuyBoxMatchSummary } from "@/lib/buybox/ai-summary";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  buyBoxId: z.string().min(1),
  take: z.number().int().min(1).max(40).optional(),
});

function mapErr(e: unknown): Response {
  if (!(e instanceof Error)) {
    return NextResponse.json({ error: "UNKNOWN" }, { status: 500 });
  }
  if (e.message === "MATCH_RATIONALE_REQUIRED" || e.message === "GUARANTEED_OUTCOME_LANGUAGE_FORBIDDEN") {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  if (e.message === "BUY_BOX_MATCH_NOT_FOUND" || e.message === "BUY_BOX_LISTING_NOT_FOUND") {
    return NextResponse.json({ error: e.message }, { status: 404 });
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

  const box = await prisma.investorBuyBox.findFirst({
    where: {
      id: parsed.data.buyBoxId,
      ownerType: ctx.owner.ownerType,
      ownerId: ctx.owner.ownerId,
    },
  });
  if (!box) {
    return NextResponse.json({ error: "BUY_BOX_NOT_FOUND" }, { status: 404 });
  }

  const take = parsed.data.take ?? 20;
  const matches = await prisma.buyBoxMatch.findMany({
    where: { investorBuyBoxId: parsed.data.buyBoxId },
    orderBy: { matchScore: "desc" },
    take,
  });

  const updated = [];
  try {
    for (const match of matches) {
      updated.push(await generateBuyBoxMatchSummary(match.id));
    }
  } catch (e) {
    return mapErr(e);
  }

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "BUY_BOX_SUMMARIES_GENERATED",
    payload: { buyBoxId: parsed.data.buyBoxId, count: updated.length },
  });

  return NextResponse.json({ success: true, items: updated });
}
