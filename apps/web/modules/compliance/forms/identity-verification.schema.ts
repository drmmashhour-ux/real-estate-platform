export type IdentityVerificationForm = {
  verificationId: string;
  subjectClientId?: string;
  mode: "in_person" | "remote" | "dual_process" | "entity_documentation";
  documentRefs: string[];
  verifiedByBrokerId: string;
  verifiedAt: string;
  legalCapacityConfirmed: boolean;
};
