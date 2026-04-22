import { prisma } from "@/lib/db";

export type AcquisitionNotificationKind =
  | "acquisition_contact_created"
  | "acquisition_conversion"
  | "acquisition_onboarding_complete"
  | "sales_script_conversion"
  | "investor_interest_call"
  | "broker_demo_booked_call";

export async function notifyAcquisitionAdmins(
  kind: AcquisitionNotificationKind,
  payload: Record<string, unknown>,
): Promise<void> {
  await prisma.lecipmAcquisitionAdminNotification.create({
    data: {
      kind,
      payloadJson: { ...payload, at: new Date().toISOString() } as object,
    },
  });
}

export async function countUnreadAcquisitionNotifications(): Promise<number> {
  return prisma.lecipmAcquisitionAdminNotification.count({
    where: { readAt: null },
  });
}

export async function markAcquisitionNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await prisma.lecipmAcquisitionAdminNotification.updateMany({
    where: { id: { in: ids } },
    data: { readAt: new Date() },
  });
}
