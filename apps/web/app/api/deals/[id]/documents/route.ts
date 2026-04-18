import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { loadDealWithActor } from "@/lib/deals/execution-access";
import { createExecutionDocument } from "@/modules/doc-intelligence/doc.service";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });
  const documents = await prisma.dealDocument.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    include: { documentVersions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  return Response.json({ documents });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });

  const { canMutateExecution } = await import("@/lib/deals/execution-access");
  if (!canMutateExecution(userId, user.role, deal)) {
    return Response.json({ error: "Broker or admin only" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const type = typeof body.type === "string" ? body.type : "draft_assistance";
  const templateKey = typeof body.templateKey === "string" ? body.templateKey : null;

  const doc = await createExecutionDocument({
    dealId,
    type,
    templateKey,
    structuredData: typeof body.structuredData === "object" && body.structuredData ? (body.structuredData as Record<string, unknown>) : {},
    workflowStatus: "draft",
    actorUserId: userId,
  });

  return Response.json({ document: doc });
}
