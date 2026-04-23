import { NextRequest } from "next/server";
import type { DealExecutionType } from "@prisma/client";
import { prisma } from "@repo/db";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";
import { runResidentialDealWorkspaceEngine } from "@/modules/broker-residential-copilot/broker-residential-copilot.engine";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { id } = await context.params;

  const deal = await requireBrokerDealAccess(session.userId, id, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const full = await prisma.deal.findUnique({
    where: { id: deal.id },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      documents: { orderBy: { createdAt: "desc" }, take: 40 },
      dealParties: true,
      milestones: true,
    },
  });
  if (!full) return Response.json({ error: "Not found" }, { status: 404 });

  const workspace = await runResidentialDealWorkspaceEngine(full);

  return Response.json({ deal: full, workspace });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { id } = await context.params;

  const deal = await requireBrokerDealAccess(session.userId, id, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || !canMutateExecution(session.userId, user.role, deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: {
    assignedFormPackageKey?: string | null;
    executionMetadata?: object;
    dealExecutionType?: DealExecutionType | null;
    crmStage?: string | null;
  } = {};

  if ("assignedFormPackageKey" in body) {
    data.assignedFormPackageKey =
      body.assignedFormPackageKey === null ? null : String(body.assignedFormPackageKey).slice(0, 160);
  }
  if ("executionMetadata" in body && body.executionMetadata !== null && typeof body.executionMetadata === "object") {
    data.executionMetadata = body.executionMetadata as object;
  }
  if ("dealExecutionType" in body && body.dealExecutionType !== undefined) {
    data.dealExecutionType = (body.dealExecutionType as DealExecutionType | null) ?? null;
  }
  if ("crmStage" in body && body.crmStage !== undefined) {
    data.crmStage = body.crmStage === null ? null : String(body.crmStage).slice(0, 64);
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No updatable fields" }, { status: 400 });
  }

  const updated = await prisma.deal.update({
    where: { id: deal.id },
    data,
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      documents: { orderBy: { createdAt: "desc" }, take: 20 },
      dealParties: true,
      milestones: true,
    },
  });

  void logDealExecutionEvent({
    eventType: "form_package_selected",
    userId: session.userId,
    dealId: deal.id,
    metadata: { patchKeys: Object.keys(data) },
  });

  const workspace = await runResidentialDealWorkspaceEngine(updated);

  return Response.json({ deal: updated, workspace });
}
