import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** GET /api/design-studio/references?listingId=... – list design references for a listing. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    if (!listingId) {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }

    const refs = await prisma.listingDesignReference.findMany({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return Response.json({
      references: refs.map((r) => ({
        id: r.id,
        listingId: r.listingId,
        source: r.source,
        designUrl: r.designUrl,
        title: r.title,
        createdAt: r.createdAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ references: [] }, { status: 500 });
  }
}
