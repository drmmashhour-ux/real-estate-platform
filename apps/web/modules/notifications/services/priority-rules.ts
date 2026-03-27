/** Deterministic priority hints for workflow triggers (extend as needed). */
export const priorityRules = {
  contractSignatureDue: "URGENT" as const,
  offerExpiring: "URGENT" as const,
  offerReviewBroker: "HIGH" as const,
  appointmentConfirm: "HIGH" as const,
  documentReview: "HIGH" as const,
  counterOfferBuyer: "HIGH" as const,
  messageUnread: "NORMAL" as const,
  intakeUpdate: "NORMAL" as const,
  systemInfo: "LOW" as const,
};

