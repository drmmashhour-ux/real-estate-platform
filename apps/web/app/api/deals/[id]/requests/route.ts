import { DealRequestCategory, CoordinationTargetRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canMutateCoordination, loadDealForCoordination } from "@/lib/deals/coordination-access";
import { coordinationFlags } from "@/lib/deals/coordination-feature-flags";
import { createDealRequest, listDealRequests } from "@/modules/document-requests/document-request.service";
import { getTemplateForCategory } from "@/modules/document-requests/request-template.service";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const gate = await loadDealForCoordination(dealId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
  const rows = await listDealRequests(dealId);
  return Response.json({ requests: rows });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const gate = await loadDealForCoordination(dealId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
  if (!canMutateCoordination(gate)) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const category = body.requestCategory as DealRequestCategory | undefined;
  const useTemplate = body.useTemplate === true && category;
  const template = useTemplate ? getTemplateForCategory(category) : null;

  const row = await createDealRequest(
    dealId,
    {
      requestType: (body.requestType as string) ?? template?.requestType ?? "custom",
      requestCategory: category ?? "OTHER",
      title: (body.title as string) ?? template?.title ?? "Document request",
      summary: (body.summary as string) ?? template?.summary ?? null,
      targetRole: (body.targetRole as CoordinationTargetRole) ?? template?.targetRole ?? "BROKER",
      targetEntityType: (body.targetEntityType as string) ?? null,
      targetEntityId: (body.targetEntityId as string) ?? null,
      dueAt: body.dueAt ? new Date(String(body.dueAt)) : null,
      metadata: (body.metadata as Record<string, unknown>) ?? {},
      items: (body.items as { itemKey: string; itemLabel: string; isRequired?: boolean }[]) ?? template?.items,
    },
    userId
  );

  const flags = await coordinationFlags();
  return Response.json({ request: row, flags: { coordination: flags } });
}
