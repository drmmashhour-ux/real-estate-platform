import { isBrokerLikeRole } from "@/modules/offers/services/offer-access";
import type { PlatformRole, MessageType } from "@prisma/client";
import type { RecentLine } from "@/modules/messaging/ai/conversation-context";

export function crmMessageToLine(
  body: string,
  messageType: MessageType,
  senderRole: PlatformRole
): RecentLine {
  if (messageType === "SYSTEM") {
    return { role: "system", text: body };
  }
  const role: RecentLine["role"] = isBrokerLikeRole(senderRole) ? "broker" : "client";
  return { role, text: body };
}

export function lecipmSenderToLine(senderRole: string, body: string): RecentLine {
  const r = senderRole.toLowerCase();
  if (r === "broker" || r === "system") {
    return { role: r === "system" ? "system" : "broker", text: body };
  }
  return { role: "client", text: body };
}
