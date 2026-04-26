import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { canManageCapitalDeal } from "@/modules/amf-capital/amf-access.service";
import { setDealStatus, updateDealComplianceFlags } from "@/modules/amf-capital/amf-capital.service";

/**
 * PATCH /api/amf-capital/deals/[id]/status
 * Body: { status?: string, allowsPublicMarketing?: boolean, exemptionNarrative?: string | null }
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const { id: capitalDealId } = await context.params;

    const ok = await canManageCapitalDeal(capitalDealId, userId, user?.role ?? null);
    if (!ok) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));

    if (typeof body.status === "string") {
      await setDealStatus(capitalDealId, body.status, userId);
    }

    if (
      typeof body.allowsPublicMarketing === "boolean" ||
      body.exemptionNarrative !== undefined
    ) {
      await updateDealComplianceFlags(
        capitalDealId,
        {
          allowsPublicMarketing:
            typeof body.allowsPublicMarketing === "boolean" ? body.allowsPublicMarketing : undefined,
          exemptionNarrative:
            typeof body.exemptionNarrative === "string" || body.exemptionNarrative === null ?
              body.exemptionNarrative
            : undefined,
        },
        userId
      );
    }

    const deal = await prisma.amfCapitalDeal.findUnique({ where: { id: capitalDealId } });
    return Response.json({ deal });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
