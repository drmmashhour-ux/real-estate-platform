/**
 * Twilio SMS — optional; logs when not configured.
 * Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (E.164)
 */

export function isTwilioSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_PHONE_NUMBER?.trim()
  );
}

export async function sendTwilioSms(params: {
  toE164: string;
  body: string;
}): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!sid || !token || !from) {
    console.info("[TwilioSMS] Skipped (not configured). Would send to", params.toE164);
    return { ok: false, error: "NOT_CONFIGURED" };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const form = new URLSearchParams();
  form.set("To", params.toE164);
  form.set("From", from);
  form.set("Body", params.body.slice(0, 1600));

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
  if (!res.ok) {
    return { ok: false, error: data.message ?? `HTTP_${res.status}` };
  }
  return { ok: true, sid: data.sid };
}
