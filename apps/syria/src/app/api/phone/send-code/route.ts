import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { createAndStorePhoneOtp } from "@/lib/anti-fraud/phone-otp";
import { ensureGuestUserForPhone } from "@/lib/syria-mvp-guest";
import { onlyDigits } from "@/lib/syria-phone";
import { setSessionUserId } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth";

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
  } else {
    await prisma.syriaAppUser.update({
      where: { id: user.id },
      data: { phone },
    });
  }

  const created = await createAndStorePhoneOtp(user.id);
  if (!created.ok) {
    return NextResponse.json({ ok: false, error: "send_rate" }, { status: 429 });
  }

  const devEcho = process.env.SYRIA_DEV_OTP_ECHO === "1" || process.env.SYRIA_DEV_OTP_ECHO === "true";
  return NextResponse.json(
    devEcho ? { ok: true, devCode: created.codeForSms } : { ok: true },
    { status: 200 },
  );
}
