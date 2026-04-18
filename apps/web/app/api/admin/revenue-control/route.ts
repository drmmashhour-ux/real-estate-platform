import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const PatchZ = z.object({
  revenueMonetizationEnabled: z.boolean().optional(),
  revenueLeadUnlockMinCents: z.number().int().positive().optional().nullable(),
  revenueLeadUnlockMaxCents: z.number().int().positive().optional().nullable(),
  revenueLeadDefaultPriceCents: z.number().int().min(0).optional().nullable(),
  revenueListingBoostPriceCents: z.number().int().min(0).optional().nullable(),
  revenueListingBoostDurationDays: z.number().int().min(1).max(365).optional().nullable(),
  bnhubHostFeePercentOverride: z.number().min(0).max(50).optional().nullable(),
});

export async function GET() {
  await requireAdminControlUserId();
  const row = await prisma.platformFinancialSettings.findUnique({ where: { id: "default" } });
  if (!row) {
    return NextResponse.json({ error: "Settings not initialized" }, { status: 500 });
  }
  return NextResponse.json({
    revenueMonetizationEnabled: row.revenueMonetizationEnabled,
    revenueLeadUnlockMinCents: row.revenueLeadUnlockMinCents,
    revenueLeadUnlockMaxCents: row.revenueLeadUnlockMaxCents,
    revenueLeadDefaultPriceCents: row.revenueLeadDefaultPriceCents,
    revenueListingBoostPriceCents: row.revenueListingBoostPriceCents,
    revenueListingBoostDurationDays: row.revenueListingBoostDurationDays,
    bnhubHostFeePercentOverride: row.bnhubHostFeePercentOverride?.toString() ?? null,
  });
}

export async function PATCH(req: Request) {
  await requireAdminControlUserId();
  const json = await req.json().catch(() => ({}));
  const parsed = PatchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;
  const data: Prisma.PlatformFinancialSettingsUpdateInput = {};
  if (b.revenueMonetizationEnabled !== undefined) data.revenueMonetizationEnabled = b.revenueMonetizationEnabled;
  if (b.revenueLeadUnlockMinCents !== undefined) data.revenueLeadUnlockMinCents = b.revenueLeadUnlockMinCents;
  if (b.revenueLeadUnlockMaxCents !== undefined) data.revenueLeadUnlockMaxCents = b.revenueLeadUnlockMaxCents;
  if (b.revenueLeadDefaultPriceCents !== undefined) {
    data.revenueLeadDefaultPriceCents =
      b.revenueLeadDefaultPriceCents == null || b.revenueLeadDefaultPriceCents === 0
        ? null
        : b.revenueLeadDefaultPriceCents;
  }
  if (b.revenueListingBoostPriceCents !== undefined) {
    data.revenueListingBoostPriceCents = b.revenueListingBoostPriceCents;
  }
  if (b.revenueListingBoostDurationDays !== undefined) {
    data.revenueListingBoostDurationDays = b.revenueListingBoostDurationDays;
  }
  if (b.bnhubHostFeePercentOverride !== undefined) {
    data.bnhubHostFeePercentOverride =
      b.bnhubHostFeePercentOverride == null ? null : b.bnhubHostFeePercentOverride;
  }
  const updated = await prisma.platformFinancialSettings.update({
    where: { id: "default" },
    data,
  });
  return NextResponse.json({ ok: true, settings: updated });
}
