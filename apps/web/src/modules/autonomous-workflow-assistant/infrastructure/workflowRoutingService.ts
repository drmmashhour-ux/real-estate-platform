import type { SellerDeclarationDraftStatus } from "@prisma/client";

export function recommendRoutingFromStatus(status: SellerDeclarationDraftStatus): "awaiting_review" | "needs_changes" | "stable" {
  if (status === "needs_changes") return "needs_changes";
  if (status === "in_review" || status === "draft") return "awaiting_review";
  return "stable";
}
