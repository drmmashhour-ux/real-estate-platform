import { NextRequest } from "next/server";
import { Prisma, type BnhubListingServicePricingType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { assertListingOwner } from "@/lib/bnhub/hospitality-addons";

export const dynamic = "force-dynamic";

type UpsertBody = {
  serviceId: string;
  isEnabled?: boolean;
  pricingType?: BnhubListingServicePricingType;
  priceCents?: number;
  currency?: string;
  isIncluded?: boolean;
  requiresApproval?: boolean;
  availabilityRules?: Record<string, unknown> | null;
  notes?: string | null;
};

/** GET — host: all catalog services + this listing’s row (if any). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const userId = await getGuestId();
  const { listingId } = await params;
  const gate = await assertListingOwner(userId, listingId);
  if (!gate.ok) return Response.json({ error: gate.message }, { status: gate.status });

  const [catalog, listingRows] = await Promise.all([
    prisma.bnhubService.findMany({
      where: {},
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.bnhubListingService.findMany({
      where: { listingId },
      include: { service: true },
    }),
  ]);
  const byServiceId = new Map(listingRows.map((r) => [r.serviceId, r]));
  return Response.json({
    catalog,
    listingServices: listingRows,
    merged: catalog.map((c) => ({
      service: c,
      offer: byServiceId.get(c.id) ?? null,
    })),
  });
}

/** PUT — host upsert one listing service configuration. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const userId = await getGuestId();
  const { listingId } = await params;
  const gate = await assertListingOwner(userId, listingId);
  if (!gate.ok) return Response.json({ error: gate.message }, { status: gate.status });

  let body: UpsertBody;
  try {
    body = (await request.json()) as UpsertBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.serviceId) {
    return Response.json({ error: "serviceId required" }, { status: 400 });
  }

  const catalog = await prisma.bnhubService.findUnique({ where: { id: body.serviceId } });
  if (!catalog?.isActive) {
    return Response.json({ error: "Service not available" }, { status: 400 });
  }

  const pricingType = body.pricingType ?? "FIXED";
  const priceCents = Math.max(0, Math.min(50_000_00, body.priceCents ?? 0));

  const availabilityRulesValue: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined =
    body.availabilityRules === undefined
      ? undefined
      : body.availabilityRules === null
        ? Prisma.JsonNull
        : (body.availabilityRules as Prisma.InputJsonValue);

  const row = await prisma.bnhubListingService.upsert({
    where: {
      listingId_serviceId: { listingId, serviceId: body.serviceId },
    },
    create: {
      listingId,
      hostUserId: userId,
      serviceId: body.serviceId,
      isEnabled: body.isEnabled ?? true,
      pricingType,
      priceCents,
      currency: body.currency ?? "USD",
      isIncluded: body.isIncluded ?? false,
      requiresApproval: body.requiresApproval ?? false,
      ...(availabilityRulesValue !== undefined ? { availabilityRules: availabilityRulesValue } : {}),
      notes: body.notes === undefined ? undefined : body.notes,
    },
    update: {
      ...(body.isEnabled !== undefined ? { isEnabled: body.isEnabled } : {}),
      ...(body.pricingType !== undefined ? { pricingType: body.pricingType } : {}),
      ...(body.priceCents !== undefined ? { priceCents } : {}),
      ...(body.currency !== undefined ? { currency: body.currency } : {}),
      ...(body.isIncluded !== undefined ? { isIncluded: body.isIncluded } : {}),
      ...(body.requiresApproval !== undefined ? { requiresApproval: body.requiresApproval } : {}),
      ...(body.availabilityRules !== undefined ? { availabilityRules: availabilityRulesValue } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
    include: { service: true },
  });

  return Response.json({ offer: row });
}
