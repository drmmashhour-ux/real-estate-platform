/**
 * Twilio SMS — admin / transactional sends use Basic auth to Messages API.
 * Configure: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.
 */

export async function sendSmsViaTwilio(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!sid || !token || !from) {
    if (process.env.NODE_ENV === "development") {
      console.log("[SMS] Twilio not configured. Would send:", { to, body: body.slice(0, 80) });
    }
    return false;
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({ From: from, To: to.trim(), Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      console.error("[SMS] Twilio error:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[SMS] Twilio fetch failed:", e);
    return false;
  }
}
