import { InsuranceLeadStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireInsuranceAdmin } from "@/lib/insurance/require-insurance-admin";
import { resolveLeadRevenueAmount } from "@/lib/insurance/pricing";

export const dynamic = "force-dynamic";

const ALLOWED_PATCH = new Set<InsuranceLeadStatus>([
  InsuranceLeadStatus.SENT,
  InsuranceLeadStatus.CONVERTED,
  InsuranceLeadStatus.REJECTED,
]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireInsuranceAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.status?.trim().toUpperCase();
  if (!raw || !ALLOWED_PATCH.has(raw as InsuranceLeadStatus)) {
    return Response.json(
      { error: "status must be sent, converted, or rejected (case-insensitive)." },
      { status: 400 }
    );
  }
  const nextStatus = raw as InsuranceLeadStatus;

  const existing = await prisma.insuranceLead.findUnique({
    where: { id },
    include: { partner: true },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (nextStatus === InsuranceLeadStatus.CONVERTED) {
    if (existing.status === InsuranceLeadStatus.CONVERTED) {
      return Response.json({ ok: true, id, status: InsuranceLeadStatus.CONVERTED });
    }
    const price = resolveLeadRevenueAmount(existing);
    await prisma.$transaction([
      prisma.insuranceLead.update({
        where: { id },
        data: {
          status: InsuranceLeadStatus.CONVERTED,
          estimatedValue: price,
        },
      }),
      prisma.insuranceRevenueLog.create({
        data: {
          leadId: id,
          partnerId: existing.partnerId,
          amount: price,
          currency: "CAD",
        },
      }),
    ]);
    return Response.json({ ok: true, id, status: InsuranceLeadStatus.CONVERTED });
  }

  const updated = await prisma.insuranceLead.update({
    where: { id },
    data: { status: nextStatus },
    select: { id: true, status: true },
  });

  return Response.json({ ok: true, id: updated.id, status: updated.status });
}
