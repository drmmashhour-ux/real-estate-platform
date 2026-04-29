/** Mirror of Prisma `ConversationType` / `MessageType` — client bundles must not import `@prisma/client`. */
export type ConversationType =
  | "DIRECT"
  | "LISTING"
  | "OFFER"
  | "CONTRACT"
  | "APPOINTMENT"
  | "CLIENT_THREAD"
  | "SUPPORT";

export type MessageType = "TEXT" | "SYSTEM" | "NOTE" | "VOICE";
