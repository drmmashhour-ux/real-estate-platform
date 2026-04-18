import { prisma } from "@/lib/db";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { createExecutionDocument } from "@/modules/doc-intelligence/doc.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { id: dealId } = await context.params;
  const deal = await requireBrokerDealAccess(session.userId, dealId, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const documents = await prisma.dealDocument.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    include: { documentVersions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  return Response.json({ documents });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { id: dealId } = await context.params;
  const deal = await requireBrokerDealAccess(session.userId, dealId, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

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
    actorUserId: session.userId,
  });

  return Response.json({ document: doc });
}
