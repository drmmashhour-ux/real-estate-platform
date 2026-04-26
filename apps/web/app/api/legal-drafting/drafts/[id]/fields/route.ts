import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { appendLegalFormAudit } from "@/lib/forms/audit";
import { assertDraftAccess } from "@/lib/forms/guards";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  const access = await assertDraftAccess(id, auth.userId);
  if (!access.ok) {
    return Response.json({ error: "Not found" }, { status: access.status });
  }

  const body = await req.json().catch(() => ({}));
  const patch = typeof body.fieldValues === "object" && body.fieldValues ? body.fieldValues : null;
  if (!patch) {
    return Response.json({ error: "fieldValues object required" }, { status: 400 });
  }

  const draft = await prisma.legalFormDraft.findUnique({ where: { id } });
  if (!draft) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const prev = (draft.fieldValuesJson ?? {}) as Record<string, unknown>;
  const merged = { ...prev, ...patch };

  await prisma.legalFormDraft.update({
    where: { id },
    data: {
      fieldValuesJson: merged as object,
      status: draft.status === "exported" ? "exported" : "review_required",
    },
  });

  await appendLegalFormAudit({
    draftId: id,
    actorUserId: auth.userId,
    eventType: "field_edited",
    metadata: { keys: Object.keys(patch) },
  });

  return Response.json({ ok: true, fieldValues: merged });
}
