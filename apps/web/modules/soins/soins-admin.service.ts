import { prisma } from "@/lib/db";

export async function getSoinsAdminOverviewVm() {
  const [residents, recentEvents, residenceCount] = await Promise.all([
    prisma.residentProfile.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: {
        user: { select: { email: true, name: true, phone: true } },
        residence: { select: { id: true, title: true, city: true } },
        familyAccess: {
          include: {
            familyUser: { select: { id: true, email: true, name: true } },
          },
        },
      },
    }),
    prisma.careEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        resident: {
          include: {
            user: { select: { name: true } },
            residence: { select: { title: true } },
          },
        },
      },
    }),
    prisma.careResidence.count(),
  ]);

  return { residents, recentEvents, residenceCount };
}
