import { InsuranceLeadStatus } from "@prisma/client";
import { requireInsuranceAdmin } from "@/lib/insurance/require-insurance-admin";
import { transitionInsuranceLeadStatus } from "@/lib/insurance/transition-insurance-lead-status";

export const dynamic = "force-dynamic";

const ALLOWED_PATCH = new Set<InsuranceLeadStatus>([
  InsuranceLeadStatus.CONTACTED,
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
      { error: "status must be contacted, sent, converted, or rejected (case-insensitive)." },
      { status: 400 }
    );
  }
  const nextStatus = raw as InsuranceLeadStatus;

  const result = await transitionInsuranceLeadStatus(id, nextStatus);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true, id: result.id, status: result.status });
}
