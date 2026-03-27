import { prisma } from "@/lib/db";

/** Merge tenant scope into a where clause. */
export function withTenantScope<T extends Record<string, unknown>>(
  tenantId: string,
  where: T
): T & { tenantId: string } {
  return { ...where, tenantId };
}

export async function assertResourceBelongsToTenant(
  table:
    | "listing"
    | "brokerClient"
    | "offer"
    | "contract"
    | "appointment"
    | "conversation"
    | "message"
    | "documentFolder"
    | "documentFile"
    | "notification"
    | "actionQueueItem"
    | "dealFinancial"
    | "tenantInvoice",
  id: string,
  tenantId: string
): Promise<void> {
  const row =
    table === "listing"
      ? await prisma.listing.findFirst({ where: { id, tenantId }, select: { id: true } })
      : table === "brokerClient"
        ? await prisma.brokerClient.findFirst({ where: { id, tenantId }, select: { id: true } })
        : table === "offer"
          ? await prisma.offer.findFirst({ where: { id, tenantId }, select: { id: true } })
          : table === "contract"
            ? await prisma.contract.findFirst({ where: { id, tenantId }, select: { id: true } })
            : table === "appointment"
              ? await prisma.appointment.findFirst({ where: { id, tenantId }, select: { id: true } })
              : table === "conversation"
                ? await prisma.conversation.findFirst({ where: { id, tenantId }, select: { id: true } })
                : table === "message"
                  ? await prisma.message.findFirst({ where: { id, tenantId }, select: { id: true } })
                  : table === "documentFolder"
                    ? await prisma.documentFolder.findFirst({ where: { id, tenantId }, select: { id: true } })
                    : table === "documentFile"
                      ? await prisma.documentFile.findFirst({ where: { id, tenantId }, select: { id: true } })
                      : table === "notification"
                        ? await prisma.notification.findFirst({ where: { id, tenantId }, select: { id: true } })
                        : table === "actionQueueItem"
                          ? await prisma.actionQueueItem.findFirst({ where: { id, tenantId }, select: { id: true } })
                          : table === "dealFinancial"
                            ? await prisma.dealFinancial.findFirst({ where: { id, tenantId }, select: { id: true } })
                            : await prisma.tenantInvoice.findFirst({ where: { id, tenantId }, select: { id: true } });

  if (!row) throw new Error("resource_tenant_mismatch");
}
