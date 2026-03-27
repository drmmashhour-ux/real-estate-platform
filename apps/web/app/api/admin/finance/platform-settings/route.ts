import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { isAdminOnly } from "@/lib/admin/finance-access";
import { getPlatformFinancialSettings } from "@/lib/finance/platform-financial-settings";
import { prisma } from "@/lib/db";
import { logFinancialAction } from "@/lib/admin/financial-audit";

export const dynamic = "force-dynamic";

/**
 * GET — ADMIN + ACCOUNTANT (read-only for accountant).
 * Registration numbers are merged with env (`PLATFORM_*`) when DB fields are empty — never exposed on public routes.
 */
export async function GET(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getPlatformFinancialSettings();

  return Response.json({
    settings: {
      ...settings,
      defaultGstRate: settings.defaultGstRate.toString(),
      defaultQstRate: settings.defaultQstRate.toString(),
    },
  });
}

type PatchBody = {
  legalName?: string | null;
  platformGstNumber?: string | null;
  platformQstNumber?: string | null;
  defaultGstRate?: number;
  defaultQstRate?: number;
  applyTaxToPlatformServices?: boolean;
  applyTaxToBrokerCommissions?: boolean;
  /** Per payment_type tax toggles, e.g. { "subscription": { "taxPlatform": true, "taxBroker": false } } */
  paymentTypeTaxOverrides?: Record<string, { taxPlatform?: boolean; taxBroker?: boolean }> | null;
  /** AMF / securities risk — default off; requires legal review before enabling. */
  investmentFeaturesEnabled?: boolean;
};

/** PATCH — ADMIN only (sensitive configuration) */
export async function PATCH(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor || !isAdminOnly(actor.role)) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const before = await getPlatformFinancialSettings();
  const data: Record<string, unknown> = {};
  if (body.legalName !== undefined) data.legalName = body.legalName?.slice(0, 200) ?? null;
  if (body.platformGstNumber !== undefined) data.platformGstNumber = body.platformGstNumber?.slice(0, 32) ?? null;
  if (body.platformQstNumber !== undefined) data.platformQstNumber = body.platformQstNumber?.slice(0, 32) ?? null;
  if (body.defaultGstRate !== undefined) data.defaultGstRate = new Prisma.Decimal(body.defaultGstRate);
  if (body.defaultQstRate !== undefined) data.defaultQstRate = new Prisma.Decimal(body.defaultQstRate);
  if (body.applyTaxToPlatformServices !== undefined) data.applyTaxToPlatformServices = body.applyTaxToPlatformServices;
  if (body.applyTaxToBrokerCommissions !== undefined) data.applyTaxToBrokerCommissions = body.applyTaxToBrokerCommissions;
  if (body.paymentTypeTaxOverrides !== undefined) {
    data.paymentTypeTaxOverrides =
      body.paymentTypeTaxOverrides === null ? Prisma.JsonNull : (body.paymentTypeTaxOverrides as object);
  }
  if (body.investmentFeaturesEnabled !== undefined) data.investmentFeaturesEnabled = body.investmentFeaturesEnabled;

  const updated = await prisma.platformFinancialSettings.update({
    where: { id: "default" },
    data: data as Prisma.PlatformFinancialSettingsUpdateInput,
  });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logFinancialAction({
    actorUserId: actor.user.id,
    action: "platform_financial_settings_update",
    ipAddress: ip,
    metadata: {
      before: {
        gst: before.defaultGstRate.toString(),
        qst: before.defaultQstRate.toString(),
        applyPlatform: before.applyTaxToPlatformServices,
        applyBroker: before.applyTaxToBrokerCommissions,
      },
      after: {
        gst: updated.defaultGstRate.toString(),
        qst: updated.defaultQstRate.toString(),
        applyPlatform: updated.applyTaxToPlatformServices,
        applyBroker: updated.applyTaxToBrokerCommissions,
        paymentTypeKeys:
          updated.paymentTypeTaxOverrides && typeof updated.paymentTypeTaxOverrides === "object"
            ? Object.keys(updated.paymentTypeTaxOverrides as object)
            : [],
        investmentFeaturesEnabled: updated.investmentFeaturesEnabled,
      },
    },
  });

  return Response.json({
    ok: true,
    settings: {
      ...updated,
      defaultGstRate: updated.defaultGstRate.toString(),
      defaultQstRate: updated.defaultQstRate.toString(),
    },
  });
}
