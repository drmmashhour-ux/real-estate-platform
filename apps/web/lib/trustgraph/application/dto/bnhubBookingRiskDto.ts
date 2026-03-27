import type { ReadinessLevel } from "@prisma/client";

export type BnhubBookingRecommendedAction =
  | "auto_approve_eligible"
  | "require_deposit"
  | "manual_review"
  | "request_more_info";

export type BnhubBookingRiskSafeDto = {
  publicLabel: "Ready" | "Needs Review" | "Deposit Recommended";
  recommendedAction: BnhubBookingRecommendedAction;
};

export type BnhubBookingRiskAdminDto = BnhubBookingRiskSafeDto & {
  readinessLevel: ReadinessLevel | null;
  overallScore: number | null;
  internalNotes: string[];
};

export function toBnhubBookingRiskDtos(args: {
  overallScore: number | null;
  readinessLevel: ReadinessLevel | null;
  depositRecommended: boolean;
  manualReviewHint: boolean;
}): { safe: BnhubBookingRiskSafeDto; admin: BnhubBookingRiskAdminDto } {
  let recommendedAction: BnhubBookingRecommendedAction = "auto_approve_eligible";
  if (args.manualReviewHint || args.readinessLevel === "action_required") {
    recommendedAction = "manual_review";
  } else if (args.depositRecommended) {
    recommendedAction = "require_deposit";
  } else if (args.readinessLevel === "partial") {
    recommendedAction = "request_more_info";
  }

  let publicLabel: BnhubBookingRiskSafeDto["publicLabel"] = "Ready";
  if (recommendedAction === "require_deposit") publicLabel = "Deposit Recommended";
  else if (recommendedAction === "manual_review" || recommendedAction === "request_more_info") {
    publicLabel = "Needs Review";
  }

  const safe: BnhubBookingRiskSafeDto = { publicLabel, recommendedAction };

  const admin: BnhubBookingRiskAdminDto = {
    ...safe,
    readinessLevel: args.readinessLevel,
    overallScore: args.overallScore,
    internalNotes: [
      args.depositRecommended ? "deposit_threshold_met" : "deposit_threshold_clear",
      args.manualReviewHint ? "manual_review_signal" : "no_manual_review_signal",
    ],
  };

  return { safe, admin };
}
