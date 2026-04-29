/**
 * SYBNB SMS transport — minimal stub until Twilio / local gateway.
 * Never log full phone numbers or message bodies in production.
 */

/** Only send when explicitly enabled (default off). */
export function isSybnbSmsEnabled(): boolean {
  return process.env.SYBNB_SMS_ENABLED === "true";
}

function maskPhoneEnd(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length < 2) return "***";
  return `***${d.slice(-2)}`;
}

/**
 * @returns normalized digits-only string or null if unusable
 */
export function normalizeSmsRecipient(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

/**
 * Outbound SMS — fixed templates only from callers; no URLs or PII in `message`.
 * Dev: console.log with masked destination. Prod (enabled): placeholder until provider wiring.
 */
export async function sendSMS(phone: string, message: string): Promise<void> {
  if (!isSybnbSmsEnabled()) return;

  const to = normalizeSmsRecipient(phone);
  if (!to) return;

  const trimmed = message.trim();
  if (!trimmed) return;

  if (process.env.NODE_ENV === "development") {
    console.log("[SMS:out]", { to: maskPhoneEnd(to), message: trimmed });
    return;
  }

  // Production: integrate Twilio / regional gateway here — avoid logging body or full MSISDN.
  console.warn("[SMS:out] queued (provider not configured)", {
    to: maskPhoneEnd(to),
    chars: trimmed.length,
  });
}
