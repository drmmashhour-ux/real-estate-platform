import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";

export const dynamic = "force-dynamic";

type Body = {
  applyTaxToPlatformServices?: boolean;
  applyTaxToBrokerCommissions?: boolean;
};

/**
 * PATCH — ADMIN + ACCOUNTANT. Sets `taxOverrideJson` on a platform payment (re-run invoices via support process if needed).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getFinanceActor();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = await prisma.platformPayment.findUnique({ where: { id } });
  if (!payment) return Response.json({ error: "Not found" }, { status: 404 });

  const taxOverrideJson: Record<string, boolean> = {};
  if (typeof body.applyTaxToPlatformServices === "boolean") {
    taxOverrideJson.applyTaxToPlatformServices = body.applyTaxToPlatformServices;
  }
  if (typeof body.applyTaxToBrokerCommissions === "boolean") {
    taxOverrideJson.applyTaxToBrokerCommissions = body.applyTaxToBrokerCommissions;
  }
  if (Object.keys(taxOverrideJson).length === 0) {
    return Response.json({ error: "No valid override fields" }, { status: 400 });
  }

  const existing =
    payment.taxOverrideJson != null && typeof payment.taxOverrideJson === "object" && !Array.isArray(payment.taxOverrideJson)
      ? (payment.taxOverrideJson as Record<string, boolean>)
      : {};

  await prisma.platformPayment.update({
    where: { id },
    data: { taxOverrideJson: { ...existing, ...taxOverrideJson } },
  });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logFinancialAction({
    actorUserId: actor.user.id,
    action: "payment_tax_override",
    entityType: "PLATFORM_PAYMENT",
    entityId: id,
    ipAddress: ip,
    metadata: { taxOverrideJson },
  });

  return Response.json({ ok: true });
}
