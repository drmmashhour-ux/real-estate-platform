import { prisma } from "@/lib/db";
import { NotificationType } from "@prisma/client";

/** Alert admins when a deal is created without an Immo auto-link while prior listing+buyer leads exist. */
export async function notifyAdminsImmoPossibleBypass(params: {
  dealId: string;
  listingId: string;
  priorLeadId: string;
}): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", accountStatus: "ACTIVE" },
    select: { id: true },
    take: 25,
  });
  await Promise.all(
    admins.map((a) =>
      prisma.notification
        .create({
          data: {
            userId: a.id,
            type: NotificationType.CRM,
            title: "Possible ImmoContact bypass",
            message: `Deal ${params.dealId.slice(0, 8)}… was created without an auto-linked Immo lead, but a prior lead exists for this listing and buyer. Review /admin/immocontacts.`,
            actionUrl: "/admin/immocontacts",
            actionLabel: "Review Immo contacts",
            metadata: {
              dealId: params.dealId,
              listingId: params.listingId,
              priorLeadId: params.priorLeadId,
            } as object,
          },
        })
        .catch(() => {})
    )
  );
}
