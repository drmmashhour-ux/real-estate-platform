import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireClosingPipelineV1 } from "@/lib/deals/pipeline-feature-guard";
import { applyQuebecNotaryUpdate } from "@/modules/quebec-closing/quebec-closing.service";
import { QC_NOTARY_CHECKLIST_KEYS } from "@/modules/quebec-closing/quebec-closing.types";
import type { QcNotaryChecklistKey } from "@/modules/quebec-closing/quebec-closing.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gated = requireClosingPipelineV1();
  if (gated) return gated;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (!canMutateExecution(auth.userId, auth.role, auth.deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const checklistRaw = body.checklist;
  const checklist: Partial<Record<QcNotaryChecklistKey, { status: string; notes?: string | null }>> = {};
  if (checklistRaw && typeof checklistRaw === "object" && checklistRaw !== null) {
    for (const key of QC_NOTARY_CHECKLIST_KEYS) {
      const entry = (checklistRaw as Record<string, unknown>)[key];
      if (entry && typeof entry === "object" && "status" in entry) {
        const st = (entry as { status: unknown }).status;
        const notes = (entry as { notes?: unknown }).notes;
        if (typeof st === "string") {
          checklist[key] = { status: st, notes: typeof notes === "string" ? notes : notes == null ? null : String(notes) };
        }
      }
    }
  }

  const requestedDocuments = Array.isArray(body.requestedDocuments) ? body.requestedDocuments : undefined;

  try {
    const bundle = await applyQuebecNotaryUpdate({
      dealId,
      actorUserId: auth.userId,
      notaryId: typeof body.notaryId === "string" ? body.notaryId : body.notaryId === null ? null : undefined,
      notaryDisplayName: typeof body.notaryDisplayName === "string" ? body.notaryDisplayName : undefined,
      notaryOffice: typeof body.notaryOffice === "string" ? body.notaryOffice : undefined,
      notaryEmail: typeof body.notaryEmail === "string" ? body.notaryEmail : undefined,
      notaryPhone: typeof body.notaryPhone === "string" ? body.notaryPhone : undefined,
      appointmentAt: typeof body.appointmentAt === "string" ? body.appointmentAt : body.appointmentAt === null ? null : undefined,
      requestedDocuments: requestedDocuments as unknown[] | null | undefined,
      deedReadinessNotes:
        typeof body.deedReadinessNotes === "string" ? body.deedReadinessNotes : body.deedReadinessNotes === null ? null : undefined,
      signingChannel:
        typeof body.signingChannel === "string" ? body.signingChannel : body.signingChannel === null ? null : undefined,
      checklist: Object.keys(checklist).length ? checklist : undefined,
      markPacketComplete: body.markPacketComplete === true,
    });
    return Response.json(bundle);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
