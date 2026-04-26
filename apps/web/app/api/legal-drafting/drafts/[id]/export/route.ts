import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { appendLegalFormAudit } from "@/lib/forms/audit";
import { assertDraftAccess } from "@/lib/forms/guards";
import { countBlockingAlerts } from "@/lib/forms/guards";
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
  if (body.confirmReviewed !== true) {
    return Response.json(
      { error: 'Broker review required — set confirmReviewed: true to acknowledge review before export.' },
      { status: 400 }
    );
  }

  const blocking = await countBlockingAlerts(id);
  if (blocking > 0) {
    return Response.json(
      {
        error: "Export blocked — resolve blocking alerts first.",
        blockingCount: blocking,
      },
      { status: 409 }
    );
  }

  const draft = await prisma.legalFormDraft.findUnique({ where: { id } });
  if (!draft || draft.status !== "ready") {
    return Response.json(
      { error: "Draft must be in ready status before export. Run rules and mark ready." },
      { status: 409 }
    );
  }

  const fv = draft.fieldValuesJson as Record<string, unknown>;
  const bodyText = escapeHtml(JSON.stringify(fv, null, 2));
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Legal draft export</title></head><body>
<h1>LECIPM — draft export (assistive only)</h1>
<p><strong>Not legal advice.</strong> Broker must file official OACIQ forms. This is a working copy.</p>
<pre>${bodyText}</pre>
</body></html>`;

  await prisma.legalFormDraft.update({
    where: { id },
    data: { status: "exported" },
  });

  await appendLegalFormAudit({
    draftId: id,
    actorUserId: auth.userId,
    eventType: "exported",
    metadata: { format: "html_preview" },
  });

  return Response.json({
    ok: true,
    format: "html",
    html,
    message: "Print-ready HTML preview. PDF/DOCX pipeline can be wired later.",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
