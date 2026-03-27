import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";

export const dynamic = "force-dynamic";

async function requireFinanceStaff() {
  const actor = await getFinanceActor();
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "ACCOUNTANT")) {
    return null;
  }
  return actor;
}

/** GET — single broker tax record */
export async function GET(_request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const actor = await requireFinanceStaff();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await context.params;
  const user = await prisma.user.findFirst({
    where: { id: userId, role: "BROKER" },
    select: {
      id: true,
      email: true,
      name: true,
      brokerTaxRegistration: true,
    },
  });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ user });
}

type PatchBody = {
  action: "approve" | "reject" | "mark_reviewed";
  adminNotes?: string | null;
};

/** PATCH — manual approve / reject (not government verification) */
export async function PATCH(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const actor = await requireFinanceStaff();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await context.params;
  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action !== "approve" && body.action !== "reject" && body.action !== "mark_reviewed") {
    return Response.json({ error: "action must be approve, reject, or mark_reviewed" }, { status: 400 });
  }

  const existing = await prisma.brokerTaxRegistration.findUnique({ where: { userId } });
  if (!existing) {
    return Response.json({ error: "No tax registration for this broker" }, { status: 404 });
  }

  const before = { status: existing.status };

  const notes =
    typeof body.adminNotes === "string" ? body.adminNotes.slice(0, 8000) : existing.adminNotes;

  const nextStatus =
    body.action === "approve"
      ? "APPROVED"
      : body.action === "reject"
        ? "REJECTED"
        : "MANUALLY_REVIEWED";

  const updated = await prisma.brokerTaxRegistration.update({
    where: { userId },
    data: {
      status: nextStatus,
      adminNotes: notes,
      reviewedAt: new Date(),
      reviewedByUserId: actor.user.id,
    },
  });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const actionKey =
    body.action === "approve"
      ? "broker_tax_approved"
      : body.action === "reject"
        ? "broker_tax_rejected"
        : "broker_tax_mark_reviewed";
  await logFinancialAction({
    actorUserId: actor.user.id,
    action: actionKey,
    entityType: "BrokerTaxRegistration",
    entityId: updated.id,
    ipAddress: ip,
    metadata: { brokerUserId: userId, before, after: { status: updated.status } },
  });

  return Response.json({ ok: true, registration: updated });
}
