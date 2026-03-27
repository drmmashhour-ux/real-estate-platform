import { prisma } from "@/lib/db";

/**
 * Server-side data for `/admin/property-identities`.
 * Uses models `PropertyIdentity` and `PropertyIdentityLink` from `prisma/schema.prisma`
 * (client delegates: camelCase model names on `PrismaClient`).
 */
export async function getPropertyIdentityConsoleData() {
  const [identityRows, pendingLinkRows] = await Promise.all([
    prisma.propertyIdentity.findMany({
      include: {
        riskRecords: { orderBy: { lastEvaluatedAt: "desc" }, take: 1 },
        _count: { select: { links: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.propertyIdentityLink.findMany({
      where: { linkStatus: "pending" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const identityIds = [...new Set(pendingLinkRows.map((row) => row.propertyIdentityId))];
  const identityDetails =
    identityIds.length > 0
      ? await prisma.propertyIdentity.findMany({
          where: { id: { in: identityIds } },
          select: { id: true, propertyUid: true, officialAddress: true },
        })
      : [];

  const detailById = new Map(identityDetails.map((d) => [d.id, d]));

  const initialIdentities = identityRows.map((i) => ({
    id: i.id,
    propertyUid: i.propertyUid,
    cadastreNumber: i.cadastreNumber,
    officialAddress: i.officialAddress,
    municipality: i.municipality,
    province: i.province,
    verificationScore: i.verificationScore,
    linkCount: i._count.links,
    risk: i.riskRecords[0]
      ? { riskLevel: i.riskRecords[0].riskLevel, riskScore: i.riskRecords[0].riskScore }
      : null,
    updatedAt: i.updatedAt,
  }));

  const pendingLinks = pendingLinkRows.map((l) => {
    const d = detailById.get(l.propertyIdentityId);
    return {
      id: l.id,
      listingId: l.listingId,
      listingType: l.listingType,
      linkStatus: l.linkStatus,
      propertyIdentityId: l.propertyIdentityId,
      propertyUid: d?.propertyUid ?? "",
      officialAddress: d?.officialAddress ?? "",
      createdAt: l.createdAt,
    };
  });

  return { initialIdentities, pendingLinks };
}
