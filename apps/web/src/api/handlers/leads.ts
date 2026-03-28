import { prisma } from "@/lib/db";
import { shareLeadWithPartner } from "@/src/modules/partners/leadSharing";

export type PartnerLeadBody = {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  externalRef?: string;
  shortTermListingId?: string;
};

export async function handlePublicLeadsPOST(body: PartnerLeadBody, partnerId: string | null) {
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!name || !email || !email.includes("@")) {
    return { error: "name and valid email required", status: 400 };
  }

  const lead = await prisma.lead.create({
    data: {
      name,
      email,
      phone: (body.phone ?? "").trim() || "—",
      message: (body.message ?? "").trim() || "Partner API lead",
      status: "new",
      score: 50,
      source: "partner_api",
      leadSource: "partner_api",
      shortTermListingId: body.shortTermListingId?.trim() || null,
      pipelineStatus: "new",
      pipelineStage: "new",
    },
  });

  if (partnerId) {
    await shareLeadWithPartner(partnerId, lead.id, body.externalRef?.trim() ?? undefined);
  }

  return {
    status: 201 as const,
    lead: { id: lead.id, email: lead.email, name: lead.name },
  };
}
