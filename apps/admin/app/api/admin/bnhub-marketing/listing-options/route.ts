import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { assertMarketingAdmin, MarketingAuthError } from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** Recent short-term listings for admin campaign creation picker. */
export async function GET(request: NextRequest) {
  try {
    await assertMarketingAdmin(await getGuestId());
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const rows = await prisma.shortTermListing.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { listingCode: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: {
        id: true,
        title: true,
        city: true,
        listingCode: true,
        ownerId: true,
      },
    });
    return Response.json({ listings: rows });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      return Response.json({ error: e.message }, { status: e.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error(e);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
