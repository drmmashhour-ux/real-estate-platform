import { prisma } from "@/lib/db";

/** Office roster with team groupings (v1). */
export async function getOfficeRosterWithTeams(officeId: string) {
  const [memberships, teams] = await Promise.all([
    prisma.officeMembership.findMany({
      where: { officeId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.officeTeam.findMany({
      where: { officeId },
      include: {
        lead: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    }),
  ]);
  return { memberships, teams };
}
