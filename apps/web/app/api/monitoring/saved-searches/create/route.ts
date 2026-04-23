import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";
import { createSavedSearch } from "@/lib/monitoring/saved-searches";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const bodySchema = z.object({
  title: z.string().min(1),
  searchType: z.enum(["listing", "deal", "buy_box"]),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  propertyType: z.string().nullable().optional(),
  minPriceCents: z.number().int().nullable().optional(),
  maxPriceCents: z.number().int().nullable().optional(),
  minCapRate: z.number().nullable().optional(),
  minROI: z.number().nullable().optional(),
  minCashflowCents: z.number().int().nullable().optional(),
  minDSCR: z.number().nullable().optional(),
  requiredZone: z.string().nullable().optional(),
  bedrooms: z.number().int().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  minAreaSqft: z.number().nullable().optional(),
  maxAreaSqft: z.number().nullable().optional(),
  filters: z.unknown().optional(),
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

  const b = parsed.data;
  const item = await createSavedSearch({
    ownerType: ctx.owner.ownerType,
    ownerId: ctx.owner.ownerId,
    title: b.title,
    searchType: b.searchType,
    city: b.city ?? undefined,
    province: b.province ?? "QC",
    propertyType: b.propertyType ?? undefined,
    minPriceCents: b.minPriceCents ?? undefined,
    maxPriceCents: b.maxPriceCents ?? undefined,
    minCapRate: b.minCapRate ?? undefined,
    minROI: b.minROI ?? undefined,
    minCashflowCents: b.minCashflowCents ?? undefined,
    minDSCR: b.minDSCR ?? undefined,
    requiredZone: b.requiredZone ?? undefined,
    bedrooms: b.bedrooms ?? undefined,
    bathrooms: b.bathrooms ?? undefined,
    minAreaSqft: b.minAreaSqft ?? undefined,
    maxAreaSqft: b.maxAreaSqft ?? undefined,
    filters: b.filters === undefined ? undefined : (b.filters as object),
  });

  await recordAuditEvent({
    actorUserId: ctx.userId,
    action: "MONITORING_SAVED_SEARCH_CREATED",
    payload: { savedSearchId: item.id, searchType: item.searchType },
  });

  return NextResponse.json({ success: true, item });
}
