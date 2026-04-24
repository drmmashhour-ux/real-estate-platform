import { prisma } from "@/lib/db";
import { logTurboDraftEvent } from "./auditLogger";

export async function createDealFromTurboDraft(draftId: string) {
  // @ts-ignore
  const draft = await prisma.turboDraft.findUnique({
    where: { id: draftId },
  });

  if (!draft) throw new Error("Draft not found");
  if (draft.status === "DEAL_CREATED") return; // Avoid duplicates

  const context = draft.contextJson as any;
  const result = draft.resultJson as any;

  if (!draft.canProceed) {
    throw new Error("Draft is not in a state to create a deal");
  }

  // 1. Get or create Lead
  let leadId = context.leadId;
  const buyerId = draft.userId;

  if (!leadId) {
    const buyerParty = context.parties.find((p: any) => p.role === "BUYER");
    const lead = await prisma.lead.create({
      data: {
        name: buyerParty?.name || "Turbo Buyer",
        email: buyerParty?.email || "unknown@lecipm.com",
        phone: buyerParty?.phone || "",
        message: `Turbo Draft created: ${draft.formKey}`,
        status: "NEW",
        score: 80, // High interest
        userId: buyerId || null,
        listingId: context.listingId || null,
        leadSource: "TURBO_DRAFT",
      },
    });
    leadId = lead.id;
  }

  // 2. Get Seller
  const sellerParty = context.parties.find((p: any) => p.role === "SELLER");
  if (!sellerParty || !sellerParty.id) {
    throw new Error("Seller information missing on draft");
  }

  const sellerId = sellerParty.id;
  const priceCents = context.answers.purchasePrice || 0;

  // 3. Create Deal if we have a buyer user
  let deal = null;
  if (buyerId) {
    deal = await prisma.deal.create({
      data: {
        buyerId,
        sellerId,
        listingId: context.listingId || null,
        priceCents,
        status: "initiated",
        jurisdiction: "QC",
        leadId,
        executionMetadata: {
          turboDraftId: draftId,
          formKey: draft.formKey,
        },
      },
    });
  }

  // 4. Link TurboDraft to Deal/Lead
  // @ts-ignore
  await prisma.turboDraft.update({
    where: { id: draftId },
    data: {
      status: deal ? "DEAL_CREATED" : "LEAD_CREATED",
      contextJson: { ...context, leadId, dealId: deal?.id } as any,
    },
  });

  await logTurboDraftEvent({
    draftId,
    userId: buyerId || undefined,
    eventKey: "turbo_deal_created",
    severity: "SUCCESS",
    payload: { dealId: deal?.id, leadId },
  });

  return { deal, leadId };
}
