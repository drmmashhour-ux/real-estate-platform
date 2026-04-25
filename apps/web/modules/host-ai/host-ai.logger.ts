import { logInfo } from "@/lib/logger";

const TAG = "[host-ai]";

export type HostAiLogKind = "pricing_suggestion" | "booking_suggestion" | "message_suggestion";

export function logHostAi(kind: HostAiLogKind, meta: Record<string, unknown>) {
  logInfo(TAG, { kind, ...meta });
}
