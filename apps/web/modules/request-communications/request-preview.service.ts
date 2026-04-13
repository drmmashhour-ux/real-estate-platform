import type { DealRequest } from "@prisma/client";
import { buildEmailDraftForRequest } from "./request-template-builder.service";

export function previewOutboundCommunication(req: DealRequest) {
  const draft = buildEmailDraftForRequest(req);
  return {
    disclaimer:
      "LECIPM is not your lender or notary. This text is a drafting aid for the broker; parties must rely on their professionals.",
    draft,
  };
}
