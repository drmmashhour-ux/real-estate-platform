import { NextRequest } from "next/server";
import type { DealDocumentVersionSource } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { logContractEngineEvent } from "@/lib/contract-engine/events";
import { recordDocumentVersion } from "@/modules/review/versioning.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string; documentId: string }> }) {
  const { id: dealId, documentId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true } });
  if (!user || !canMutateExecution(auth.userId, user.role, auth.deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const doc = await prisma.dealDocument.findFirst({ where: { id: documentId, dealId } });
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  let body: { source?: DealDocumentVersionSource; changesSummary?: Record<string, unknown>; snapshot?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const v = await recordDocumentVersion({
    dealDocumentId: doc.id,
    source: body.source ?? "broker_edit",
    changesSummary: body.changesSummary ?? { note: "contract_engine_version" },
    snapshot: body.snapshot,
    createdById: auth.userId,
  });

  void logContractEngineEvent("document_version_created", auth.userId, dealId, { documentId, version: v.versionNumber });
  return Response.json({ ok: true, version: v });
}
