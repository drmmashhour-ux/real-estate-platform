import { prisma } from "@/lib/db";
import { appendLegalFormAudit } from "@/lib/forms/audit";
import { assertDraftAccess, countBlockingAlerts } from "@/lib/forms/guards";
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
  const action = body.action === "mark_ready" ? "mark_ready" : body.action === "reopen" ? "reopen" : null;
  if (!action) {
    return Response.json({ error: 'action must be "mark_ready" or "reopen"' }, { status: 400 });
  }

  if (action === "mark_ready") {
    const blocking = await countBlockingAlerts(id);
    if (blocking > 0) {
      return Response.json(
        {
          error: "Possible compliance issue — resolve blocking alerts before marking ready.",
          blockingCount: blocking,
        },
        { status: 409 }
      );
    }
    await prisma.legalFormDraft.update({
      where: { id },
      data: { status: "ready" },
    });
    await appendLegalFormAudit({
      draftId: id,
      actorUserId: auth.userId,
      eventType: "reviewed",
      metadata: { status: "ready" },
    });
    return Response.json({ ok: true, status: "ready" });
  }

  await prisma.legalFormDraft.update({
    where: { id },
    data: { status: "review_required" },
  });
  await appendLegalFormAudit({
    draftId: id,
    actorUserId: auth.userId,
    eventType: "reviewed",
    metadata: { status: "review_required" },
  });
  return Response.json({ ok: true, status: "review_required" });
}
