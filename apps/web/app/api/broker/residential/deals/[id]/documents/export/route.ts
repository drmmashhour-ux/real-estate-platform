import { prisma } from "@/lib/db";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { dealExecutionFlags } from "@/config/feature-flags";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";
import { exportFilename, serializeDraftBundleJson } from "@/modules/form-rendering/export.service";
import { loadDocumentsForBundle } from "@/modules/form-rendering/document-bundle.service";
import { renderDealDraftBundle } from "@/modules/form-rendering/render.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!dealExecutionFlags.formRenderingV1) return Response.json({ error: "Disabled" }, { status: 403 });
  const { id: dealId } = await context.params;
  const deal = await requireBrokerDealAccess(session.userId, dealId, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  let body: { templateKey?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const templateKey = typeof body.templateKey === "string" ? body.templateKey : "promise_to_purchase_residential_qc";
  const full = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!full) return Response.json({ error: "Not found" }, { status: 404 });

  const bundle = renderDealDraftBundle(full, templateKey);
  const docs = await loadDocumentsForBundle(dealId);
  const json = serializeDraftBundleJson({
    ...bundle,
    sections: [
      ...bundle.sections,
      {
        templateKey: null,
        label: "Related deal documents (metadata)",
        structuredPreview: { count: docs.length, ids: docs.map((d) => d.id) },
        disclaimer: "Rows only — not official PDFs.",
      },
    ],
  });

  await logDealExecutionEvent({
    eventType: "export_generated",
    userId: session.userId,
    dealId,
    metadata: { templateKey, channel: "broker_residential" },
  });

  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(dealId)}"`,
    },
  });
}
