export type ComplaintReferralDestination =
  | "info_oaciq"
  | "public_assistance"
  | "syndic"
  | "internal_legal"
  | "internal_compliance";

export type ComplaintReferral = {
  referralId: string;
  complaintId: string;

  destination: ComplaintReferralDestination;
  reason: string;
  recommended: boolean;
  completed: boolean;
  completedAt?: string | null;
};
