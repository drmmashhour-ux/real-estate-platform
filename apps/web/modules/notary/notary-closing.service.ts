import { prisma } from "@/lib/db";

export async function scheduleNotaryAppointment(input: {
  dealId: string;
  appointmentAt: Date;
  actorUserId: string;
}) {
  await prisma.dealNotaryCoordination.upsert({
    where: { dealId: input.dealId },
    create: {
      dealId: input.dealId,
      appointmentAt: input.appointmentAt,
      packageStatus: "in_progress",
    },
    update: { appointmentAt: input.appointmentAt },
  });

  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      actionKey: "notary_appointment_scheduled",
      payload: { at: input.appointmentAt.toISOString() },
    },
  });
}

export async function confirmNotaryClosingPrep(input: { dealId: string; actorUserId: string; notes?: string | null }) {
  await prisma.dealNotaryCoordination.upsert({
    where: { dealId: input.dealId },
    create: {
      dealId: input.dealId,
      packageStatus: "ready",
      deedReadinessNotes: input.notes ?? undefined,
    },
    update: {
      packageStatus: "ready",
      deedReadinessNotes: input.notes ?? undefined,
    },
  });

  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      actionKey: "notary_closing_prep_confirmed",
      payload: {},
    },
  });
}
