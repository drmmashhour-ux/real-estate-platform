import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { assertNoAutonomousPurchase } from "@/lib/buybox/safety";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  title: z.string().min(1),
  city: z.string().nullable().optional(),
  province: z.string().optional(),
  propertyType: z.string().nullable().optional(),
  minPriceCents: z.number().int().nullable().optional(),
  maxPriceCents: z.number().int().nullable().optional(),
  minCapRate: z.number().nullable().optional(),
  minROI: z.number().nullable().optional(),
  minCashflowCents: z.number().int().nullable().optional(),
  minDSCR: z.number().nullable().optional(),
  maxRiskScore: z.number().nullable().optional(),
  requiredZone: z.string().nullable().optional(),
  preferredNeighborhoods: z.unknown().optional(),
  minBedrooms: z.number().int().nullable().optional(),
  minBathrooms: z.number().nullable().optional(),
  minAreaSqft: z.number().nullable().optional(),
  maxAreaSqft: z.number().nullable().optional(),
  strategyType: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
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

  assertNoAutonomousPurchase(parsed.data.metadata ?? null);

  const b = parsed.data;
  const item = await prisma.investorBuyBox.create({
    data: {
      ownerType: ctx.owner.ownerType,
      ownerId: ctx.owner.ownerId,
      title: b.title,
      city: b.city ?? undefined,
      province: b.province ?? "QC",
      propertyType: b.propertyType ?? undefined,
      minPriceCents: b.minPriceCents ?? undefined,
      maxPriceCents: b.maxPriceCents ?? undefined,
      minCapRate: b.minCapRate ?? undefined,
      minROI: b.minROI ?? undefined,
      minCashflowCents: b.minCashflowCents ?? undefined,
      minDSCR: b.minDSCR ?? undefined,
      maxRiskScore: b.maxRiskScore ?? undefined,
      requiredZone: b.requiredZone ?? undefined,
      preferredNeighborhoods:
        b.preferredNeighborhoods === undefined ? undefined : (b.preferredNeighborhoods as object),
      minBedrooms: b.minBedrooms ?? undefined,
      minBathrooms: b.minBathrooms ?? undefined,
      minAreaSqft: b.minAreaSqft ?? undefined,
      maxAreaSqft: b.maxAreaSqft ?? undefined,
      strategyType: b.strategyType ?? undefined,
      notes: b.notes ?? undefined,
    },
  });

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "BUY_BOX_CREATED",
    payload: { buyBoxId: item.id, title: item.title },
  });

  return NextResponse.json({ success: true, item });
}
