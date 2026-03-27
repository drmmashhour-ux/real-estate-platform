import { getGuestId } from "@/lib/auth/session";
import { assertGrowthAdmin, GrowthAuthError } from "@/src/modules/bnhub-growth-engine/services/growthAccess";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await assertGrowthAdmin(await getGuestId());
    const leads = await prisma.bnhubLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { listing: { select: { title: true, city: true, listingCode: true } } },
    });
    return Response.json({ leads });
  } catch (e) {
    if (e instanceof GrowthAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
