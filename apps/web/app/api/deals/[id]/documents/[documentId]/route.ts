import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { findDealForParticipant } from "@/lib/deals/execution-access";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string; documentId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id: dealId, documentId } = await context.params;

  const deal = await findDealForParticipant(dealId, userId);
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const doc = await prisma.dealDocument.findFirst({
    where: { id: documentId, dealId },
    include: { documentVersions: { orderBy: { versionNumber: "desc" }, take: 5 } },
  });
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ document: doc });
}
