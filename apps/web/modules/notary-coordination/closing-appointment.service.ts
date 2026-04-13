import { prisma } from "@/lib/db";
import { logCoordinationAudit } from "@/lib/deals/coordination-audit";

export async function setNotaryAppointment(dealId: string, appointmentAt: Date | null, actorUserId: string) {
  const row = await prisma.dealNotaryCoordination.upsert({
    where: { dealId },
    create: { dealId, appointmentAt: appointmentAt ?? undefined, packageStatus: "in_progress" },
    update: { appointmentAt: appointmentAt ?? undefined },
  });
  await logCoordinationAudit({
    dealId,
    action: "notary_package_updated",
    actorUserId,
    entityType: "DealNotaryCoordination",
    entityId: row.id,
    payload: { appointmentAt: appointmentAt?.toISOString() ?? null },
  });
  return row;
}
