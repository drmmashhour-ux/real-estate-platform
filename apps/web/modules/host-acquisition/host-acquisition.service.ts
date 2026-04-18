import { prisma } from "@/lib/db";
import { MONTREAL_HOST_ACQUISITION_ZONES } from "./montreal-zones.constants";

const TARGET_FIRST_HOSTS = 50;

/**
 * Real counts from DB — listing acquisition + outreach CRM. No fabricated funnel rates.
 */
export async function buildMontrealHostAcquisitionSnapshot() {
  const [listingRows, outreachTotal, outreachByStatus, hostsTotal] = await Promise.all([
    prisma.listingAcquisitionLead.findMany({
      where: {
        OR: [
          { city: { contains: "Montreal", mode: "insensitive" } },
          { city: { contains: "Montréal", mode: "insensitive" } },
        ],
      },
      select: { id: true, city: true, intakeStatus: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.outreachLead.count(),
    prisma.outreachLead.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.user.count({ where: { role: "HOST", accountStatus: "ACTIVE" } }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    targetFirstHosts: TARGET_FIRST_HOSTS,
    priorityZones: [...MONTREAL_HOST_ACQUISITION_ZONES],
    listingAcquisitionMontrealCount: listingRows.length,
    outreachLeadsTotal: outreachTotal,
    outreachByStatus: outreachByStatus.map((r) => ({ status: r.status, count: r._count._all })),
    activeHostsPlatformWide: hostsTotal,
    disclaimers: [
      "Counts are database snapshots — not marketing claims.",
      "first_50 goal is operational — progress = onboarded hosts + outreach pipeline, reviewed manually.",
    ],
  };
}

export type MontrealHostAcquisitionSnapshot = Awaited<ReturnType<typeof buildMontrealHostAcquisitionSnapshot>>;
