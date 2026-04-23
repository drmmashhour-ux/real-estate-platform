import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  matchId: z.string().min(1),
  bookmarked: z.boolean(),
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

  const match = await prisma.buyBoxMatch.findFirst({
    where: { id: parsed.data.matchId },
    include: { investorBuyBox: true },
  });
  if (
    !match?.investorBuyBox ||
    match.investorBuyBox.ownerType !== ctx.owner.ownerType ||
    match.investorBuyBox.ownerId !== ctx.owner.ownerId
  ) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const updated = await prisma.buyBoxMatch.update({
    where: { id: match.id },
    data: { bookmarked: parsed.data.bookmarked },
  });

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "BUY_BOX_MATCH_BOOKMARKED",
    payload: { matchId: match.id, bookmarked: parsed.data.bookmarked },
  });

  return NextResponse.json({ success: true, item: updated });
}
