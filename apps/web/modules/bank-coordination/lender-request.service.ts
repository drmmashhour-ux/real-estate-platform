import { DealRequestCategory, CoordinationTargetRole } from "@prisma/client";
import { createDealRequest } from "@/modules/document-requests/document-request.service";

/** Creates a broker-owned draft request toward lender role — not sent automatically. */
export async function createLenderInfoRequestDraft(dealId: string, actorUserId: string) {
  return createDealRequest(
    dealId,
    {
      requestType: "lender_info_v1",
      requestCategory: DealRequestCategory.LENDER_DOCUMENTS,
      title: "Lender / mortgage information",
      summary: "Draft — broker to review before sharing with mortgage representative.",
      targetRole: CoordinationTargetRole.LENDER,
      items: [
        { itemKey: "commitment_or_update", itemLabel: "Financing commitment or written update", isRequired: true },
        { itemKey: "outstanding_conditions", itemLabel: "Outstanding lender conditions + dates", isRequired: true },
      ],
    },
    actorUserId
  );
}
