import { prisma } from "@/lib/db";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { listDocumentVersions } from "@/modules/review/versioning.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ documentId: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { documentId } = await context.params;

  const doc = await prisma.dealDocument.findUnique({
    where: { id: documentId },
    select: { id: true, dealId: true, type: true },
  });
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  const deal = await requireBrokerDealAccess(session.userId, doc.dealId, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const versions = await listDocumentVersions(documentId);
  return Response.json({ dealDocumentId: documentId, versions });
}
