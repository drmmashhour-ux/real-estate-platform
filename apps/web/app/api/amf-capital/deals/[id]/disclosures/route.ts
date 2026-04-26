import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { canManageCapitalDeal } from "@/modules/amf-capital/amf-access.service";
import { addDealDisclosure } from "@/modules/amf-capital/amf-capital.service";

/**
 * POST /api/amf-capital/deals/[id]/disclosures
 * Issuer uploads disclosure metadata (PDF URL already stored).
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const { id: capitalDealId } = await context.params;

    const ok = await canManageCapitalDeal(capitalDealId, userId, user?.role ?? null);
    if (!ok) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const docType = typeof body.docType === "string" ? body.docType : "";
    const title = typeof body.title === "string" ? body.title : "";
    const storageUrl = typeof body.storageUrl === "string" ? body.storageUrl : "";
    if (!docType || !title || !storageUrl) {
      return Response.json({ error: "docType, title, storageUrl required" }, { status: 400 });
    }

    const row = await addDealDisclosure({
      capitalDealId,
      docType,
      title,
      storageUrl,
      version: typeof body.version === "number" ? body.version : undefined,
    });

    return Response.json({ disclosure: row });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
