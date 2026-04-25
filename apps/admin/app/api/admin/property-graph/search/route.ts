import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

/**
 * GET /api/admin/property-graph/search
 * Query: q (cadastre, address, propertyUid), type=property|user|market, limit
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") ?? "property";
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

    if (!q) return Response.json({ error: "q required" }, { status: 400 });

    if (type === "property") {
      const properties = await prisma.propertyIdentity.findMany({
        where: {
          OR: [
            { cadastreNumber: { contains: q, mode: "insensitive" } },
            { normalizedAddress: { contains: q, mode: "insensitive" } },
            { propertyUid: { contains: q, mode: "insensitive" } },
            { municipality: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: { id: true, propertyUid: true, cadastreNumber: true, normalizedAddress: true, municipality: true, province: true },
      });
      return Response.json({ results: properties });
    }

    if (type === "user") {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: { id: true, name: true, email: true, accountStatus: true },
      });
      return Response.json({ results: users });
    }

    if (type === "market") {
      const markets = await prisma.market.findMany({
        where: {
          OR: [
            { slug: { contains: q.toLowerCase() } },
            { city: { contains: q, mode: "insensitive" } },
            { municipality: { contains: q, mode: "insensitive" } },
            { province: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
      });
      return Response.json({ results: markets });
    }

    return Response.json({ error: "type must be property, user, or market" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
