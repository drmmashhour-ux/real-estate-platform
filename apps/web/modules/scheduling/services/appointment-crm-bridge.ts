import { prisma } from "@/lib/db";
import type { Appointment, AppointmentEventType, BrokerInteractionType } from "@prisma/client";

const EVENT_TO_INTERACTION: Partial<Record<AppointmentEventType, BrokerInteractionType>> = {
  REQUESTED: "MEETING",
  CONFIRMED: "MEETING",
  RESCHEDULED: "FOLLOW_UP",
  CANCELLED: "NOTE",
  COMPLETED: "CALL",
  NO_SHOW: "FOLLOW_UP",
};

function titleFor(type: AppointmentEventType): string {
  return `Appointment: ${type.replace(/_/g, " ")}`;
}

/** Optional CRM note when a broker-client link exists. */
export async function maybeMirrorAppointmentToBrokerCrm(
  appointment: Pick<Appointment, "id" | "brokerClientId" | "brokerId">,
  eventType: AppointmentEventType,
  message: string | null
): Promise<void> {
  if (!appointment.brokerClientId) return;
  const interactionType = EVENT_TO_INTERACTION[eventType];
  if (!interactionType) return;

  await prisma.brokerClientInteraction.create({
    data: {
      brokerClientId: appointment.brokerClientId,
      actorId: null,
      type: interactionType,
      title: titleFor(eventType),
      message: message ?? undefined,
      metadata: { appointmentId: appointment.id, eventType } as object,
    },
  });
}
