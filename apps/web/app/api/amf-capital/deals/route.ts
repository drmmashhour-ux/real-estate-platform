import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { createCapitalDealWithSpv } from "@/modules/amf-capital/amf-capital.service";

/**
 * POST /api/amf-capital/deals
 * Creates capital deal + SPV. Broker/admin issuer only.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
      return Response.json({ error: "Broker or admin required" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title : "";
    const legalName = typeof body.legalName === "string" ? body.legalName : "";
    const listingId = typeof body.listingId === "string" ? body.listingId : undefined;
    const solicitationMode = typeof body.solicitationMode === "string" ? body.solicitationMode : undefined;
    const allowsPublicMarketing = typeof body.allowsPublicMarketing === "boolean" ? body.allowsPublicMarketing : undefined;
    const exemptionNarrative =
      typeof body.exemptionNarrative === "string" || body.exemptionNarrative === null ?
        body.exemptionNarrative
      : undefined;

    if (!title.trim() || !legalName.trim()) {
      return Response.json({ error: "title and legalName (SPV) are required" }, { status: 400 });
    }

    const deal = await createCapitalDealWithSpv({
      title: title.trim(),
      legalName: legalName.trim(),
      sponsorUserId: userId,
      listingId: listingId ?? null,
      solicitationMode,
      allowsPublicMarketing,
      exemptionNarrative: exemptionNarrative === null ? null : (exemptionNarrative as string),
    });

    return Response.json({
      id: deal.id,
      status: deal.status,
      spv: deal.spv,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Create failed" }, { status: 500 });
  }
}
