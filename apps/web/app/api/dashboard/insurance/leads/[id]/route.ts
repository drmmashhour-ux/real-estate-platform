import { InsuranceLeadStatus } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { insuranceHubScopedWhere, requireInsuranceHubAccess } from "@/lib/insurance/require-insurance-hub";
import { transitionInsuranceLeadStatus } from "@/lib/insurance/transition-insurance-lead-status";

export const dynamic = "force-dynamic";

const BROKER_ALLOWED = new Set<InsuranceLeadStatus>([
  InsuranceLeadStatus.NEW,
  InsuranceLeadStatus.CONTACTED,
  InsuranceLeadStatus.SENT,
  InsuranceLeadStatus.CONVERTED,
  InsuranceLeadStatus.REJECTED,
]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireInsuranceHubAccess();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.status?.trim().toUpperCase();
  if (!raw || !Object.values(InsuranceLeadStatus).includes(raw as InsuranceLeadStatus)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }
  const nextStatus = raw as InsuranceLeadStatus;

  if (auth.role === "INSURANCE_BROKER" && !BROKER_ALLOWED.has(nextStatus)) {
    return Response.json({ error: "Invalid status for broker role." }, { status: 400 });
  }

  const scope = insuranceHubScopedWhere(auth.userId, auth.role);
  const allowed = await prisma.insuranceLead.findFirst({
    where: { AND: [scope, { id }] },
    select: { id: true },
  });
  if (!allowed) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const result = await transitionInsuranceLeadStatus(id, nextStatus);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true, id: result.id, status: result.status });
}
