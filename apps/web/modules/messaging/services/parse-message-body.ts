import { MESSAGE_BODY_MAX_LENGTH } from "@/modules/messaging/services/constants";

export function parseMessageBody(
  raw: unknown
): { ok: true; body: string } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: "Message body must be a string" };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Message cannot be empty" };
  }
  if (trimmed.length > MESSAGE_BODY_MAX_LENGTH) {
    return { ok: false, error: `Message must be at most ${MESSAGE_BODY_MAX_LENGTH} characters` };
  }
  return { ok: true, body: trimmed };
}
