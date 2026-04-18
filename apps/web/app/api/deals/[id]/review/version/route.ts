import { NextRequest } from "next/server";
import { DealDocumentVersionSource } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { canMutateExecution, loadDealWithActor } from "@/lib/deals/execution-access";
import { dealExecutionFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { logApprovalAction } from "@/modules/review/approval-log.service";
import { recordDocumentVersion } from "@/modules/review/versioning.service";

const SOURCES = new Set<string>(["manual", "ai_prefill", "ai_suggestion", "broker_edit"]);

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canMutateExecution(userId, user.role, deal)) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!dealExecutionFlags.brokerReviewWorkflowV1) {
    return Response.json({ error: "Broker review workflow disabled" }, { status: 403 });
  }

  let body: { dealDocumentId?: string; source?: string; changesSummary?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const dealDocumentId = typeof body.dealDocumentId === "string" ? body.dealDocumentId : "";
  const srcRaw = typeof body.source === "string" ? body.source : "broker_edit";
  if (!dealDocumentId || !SOURCES.has(srcRaw)) {
    return Response.json({ error: "dealDocumentId and valid source required" }, { status: 400 });
  }
  const source = srcRaw as DealDocumentVersionSource;

  const doc = await prisma.dealDocument.findFirst({ where: { id: dealDocumentId, dealId } });
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  const v = await recordDocumentVersion({
    dealDocumentId,
    source,
    changesSummary: body.changesSummary ?? { note: "version_checkpoint" },
    createdById: userId,
  });

  await logApprovalAction({
    dealId,
    actorUserId: userId,
    actionKey: "document_version_recorded",
    payload: { dealDocumentId, versionNumber: v.versionNumber, source: srcRaw },
  });

  return Response.json({ version: v });
}
