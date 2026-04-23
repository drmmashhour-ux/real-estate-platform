import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";

const bodySchema = z.object({
  buyBoxId: z.string().min(1),
  take: z.number().int().min(1).max(200).optional(),
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

  const items = await prisma.buyBoxMatch.findMany({
    where: { investorBuyBoxId: parsed.data.buyBoxId },
    orderBy: { matchScore: "desc" },
    take: parsed.data.take ?? 100,
  });

  return NextResponse.json({ success: true, items });
}
