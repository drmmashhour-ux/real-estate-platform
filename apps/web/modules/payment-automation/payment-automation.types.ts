export type PaymentReminderKind = "buyer_deposit_due" | "broker_confirm_pending" | "release_checklist";

export type PaymentRiskFlag = {
  code: string;
  severity: "info" | "warn" | "block";
  message: string;
};
