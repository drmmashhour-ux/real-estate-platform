export type SignatureProviderId = "docusign" | "pandadoc" | "adobe_sign" | "manual";

export type SignatureSessionStatus =
  | "draft"
  | "pending_send"
  | "sent"
  | "in_progress"
  | "completed"
  | "declined"
  | "voided";

export type SignatureParticipantRole = "buyer" | "seller" | "broker" | "other";

export type SignatureParticipantStatus = "pending" | "signed" | "declined";
