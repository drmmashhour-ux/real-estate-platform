import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";
import { canMutateExecution, loadDealWithActor } from "@/lib/deals/execution-access";
import { dealExecutionFlags } from "@/config/feature-flags";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { exportFilename, serializeDraftBundleJson } from "@/modules/form-rendering/export.service";
import { renderDealDraftBundle } from "@/modules/form-rendering/render.service";
import { loadDocumentsForBundle } from "@/modules/form-rendering/document-bundle.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!dealExecutionFlags.formRenderingV1) {
    return Response.json({ error: "Export disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canMutateExecution(userId, user.role, deal)) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: { templateKey?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const templateKey = typeof body.templateKey === "string" ? body.templateKey : "promise_to_purchase_residential_qc";
  const full = await prisma.deal.findUnique({ where: { id: deal.id } });
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
        disclaimer: "Listing document rows only — not the official PDF content.",
      },
    ],
  });

  await logDealExecutionEvent({
    eventType: "export_generated",
    userId,
    dealId,
    metadata: { templateKey, bytes: json.length },
  });

  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(dealId)}"`,
    },
  });
}
