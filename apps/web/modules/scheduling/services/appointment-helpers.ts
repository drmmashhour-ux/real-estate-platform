import type { AppointmentEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { maybeMirrorAppointmentToBrokerCrm } from "@/modules/scheduling/services/appointment-crm-bridge";

export async function createAppointmentEvent(
  appointmentId: string,
  type: AppointmentEventType,
  actorId: string | null,
  message?: string | null,
  metadata?: Record<string, unknown>,
  client?: Prisma.TransactionClient
) {
  const db = client ?? prisma;
  await db.appointmentEvent.create({
    data: {
      appointmentId,
      actorId,
      type,
      message: message ?? undefined,
      metadata: metadata === undefined ? undefined : (metadata as object),
    },
  });
}

export async function afterAppointmentEvent(
  appointment: { id: string; brokerClientId: string | null; brokerId: string },
  eventType: AppointmentEventType,
  message: string | null
): Promise<void> {
  await maybeMirrorAppointmentToBrokerCrm(appointment, eventType, message);
}
