import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { verifyPhoneOtpAndMarkUser } from "@/lib/anti-fraud/phone-otp";
import { ensureGuestUserForPhone } from "@/lib/syria-mvp-guest";
import { onlyDigits } from "@/lib/syria-phone";
import { getSessionUser, setSessionUserId } from "@/lib/auth";

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
  const codeRaw = typeof o?.code === "string" ? o.code : "";
  const phone = onlyDigits(phoneRaw.trim());
  if (phone.length < 8) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  let user = await getSessionUser();
  if (!user) {
    user = await ensureGuestUserForPhone(phone);
    await setSessionUserId(user.id);
  }

  const result = await verifyPhoneOtpAndMarkUser(user.id, codeRaw);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.reason },
      { status: result.reason === "expired" ? 410 : 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
