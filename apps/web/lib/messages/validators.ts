import type { LecipmBrokerThreadSource } from "@prisma/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MESSAGE_BODY_MIN = 3;
export const MESSAGE_BODY_MAX = 8000;

export function isValidEmail(email: string): boolean {
  const t = email.trim();
  return t.length <= 320 && EMAIL_RE.test(t);
}

export function validateMessageBody(body: unknown): { ok: true; body: string } | { ok: false; error: string } {
  if (typeof body !== "string") return { ok: false, error: "Message must be text" };
  const t = body.trim();
  if (t.length < MESSAGE_BODY_MIN) return { ok: false, error: `Message must be at least ${MESSAGE_BODY_MIN} characters` };
  if (t.length > MESSAGE_BODY_MAX) return { ok: false, error: `Message must be at most ${MESSAGE_BODY_MAX} characters` };
  return { ok: true, body: t };
}

export function parseThreadSource(raw: unknown): { ok: true; source: LecipmBrokerThreadSource } | { ok: false; error: string } {
  const allowed: LecipmBrokerThreadSource[] = ["listing_contact", "broker_profile", "general_inquiry"];
  if (typeof raw !== "string" || !allowed.includes(raw as LecipmBrokerThreadSource)) {
    return { ok: false, error: "Invalid source" };
  }
  return { ok: true, source: raw as LecipmBrokerThreadSource };
}
