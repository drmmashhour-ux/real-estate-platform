import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { loadDealWithActor } from "@/lib/deals/execution-access";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { listDocumentVersions } from "@/modules/review/versioning.service";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string; documentId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId, documentId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });

  const doc = await prisma.dealDocument.findFirst({ where: { id: documentId, dealId } });
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  const versions = await listDocumentVersions(documentId);
  return Response.json({ versions });
}
