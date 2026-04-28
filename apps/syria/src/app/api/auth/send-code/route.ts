import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { ensureGuestUserForPhone } from "@/lib/syria-mvp-guest";
import { onlyDigits } from "@/lib/syria-phone";
import { getSessionUser, setSessionUserId } from "@/lib/auth";
import { sendAuthPhoneCodeForUser } from "@/lib/syria/auth-phone-code";

/** ORDER SYBNB-96 — send OTP; stores hash + 5m expiry on `SyriaAppUser`. Dev: code logged server-side. */
export async function POST(req: Request) {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const phoneRaw = typeof o?.phone === "string" ? o.phone : "";
  const phone = onlyDigits(phoneRaw.trim());
  if (phone.length < 8) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  let user = await getSessionUser();
  if (!user) {
    user = await ensureGuestUserForPhone(phone);
    await setSessionUserId(user.id);
  }

  const sent = await sendAuthPhoneCodeForUser({ userId: user.id, phoneDigits: phone });
  if (!sent.ok) {
    return NextResponse.json({ ok: false, error: sent.reason }, { status: 400 });
  }

  const devEcho = process.env.SYRIA_DEV_OTP_ECHO === "1" || process.env.SYRIA_DEV_OTP_ECHO === "true";
  return NextResponse.json(
    devEcho ? { ok: true, devCode: sent.codeForSms } : { ok: true },
    { status: 200 },
  );
}
