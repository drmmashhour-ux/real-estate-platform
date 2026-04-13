import { CoordinationContactType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logCoordinationAudit } from "@/lib/deals/coordination-audit";

export async function registerLenderContact(
  dealId: string,
  input: { name: string; email?: string; phone?: string; organization?: string; region?: string; roleMetadata?: Record<string, unknown> },
  actorUserId: string
) {
  const row = await prisma.coordinationContact.create({
    data: {
      dealId,
      contactType: CoordinationContactType.LENDER,
      name: input.name,
      email: input.email,
      phone: input.phone,
      organization: input.organization,
      region: input.region,
      roleMetadata: (input.roleMetadata ?? {}) as object,
    },
  });
  await logCoordinationAudit({
    dealId,
    action: "contact_registered",
    actorUserId,
    entityType: "CoordinationContact",
    entityId: row.id,
    payload: { contactType: "LENDER" },
  });
  return row;
}
