import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/property-identities
 * Query: cadastre, address (search normalized), risk_level, limit, offset.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    // In production: restrict to admin

    const { searchParams } = new URL(request.url);
    const cadastre = searchParams.get("cadastre")?.trim();
    const address = searchParams.get("address")?.trim();
    const riskLevel = searchParams.get("risk_level")?.trim();
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const offset = Number(searchParams.get("offset")) || 0;

    const where: { cadastreNumber?: object; OR?: object[] } = {};
    if (cadastre) {
      where.cadastreNumber = { contains: cadastre, mode: "insensitive" };
    }
    if (address) {
      where.OR = [
        { normalizedAddress: { contains: address, mode: "insensitive" } },
        { officialAddress: { contains: address, mode: "insensitive" } },
      ];
    }

    const identities = await prisma.propertyIdentity.findMany({
      where,
      include: {
        riskRecords: { orderBy: { lastEvaluatedAt: "desc" }, take: 1 },
        _count: { select: { links: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    let filtered = identities;
    if (riskLevel) {
      filtered = identities.filter((i) => i.riskRecords[0]?.riskLevel === riskLevel);
    }

    return Response.json({
      property_identities: filtered.map((i) => ({
        id: i.id,
        property_uid: i.propertyUid,
        cadastre_number: i.cadastreNumber,
        official_address: i.officialAddress,
        municipality: i.municipality,
        province: i.province,
        verification_score: i.verificationScore,
        link_count: i._count.links,
        risk: i.riskRecords[0]
          ? { risk_level: i.riskRecords[0].riskLevel, risk_score: i.riskRecords[0].riskScore }
          : null,
        updated_at: i.updatedAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to list property identities" },
      { status: 500 }
    );
  }
}
