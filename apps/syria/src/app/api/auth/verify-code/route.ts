import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { onlyDigits } from "@/lib/syria-phone";
import { getSessionUser } from "@/lib/auth";
import { verifyAuthPhoneCodeForUser } from "@/lib/syria/auth-phone-code";

/** ORDER SYBNB-96 — verify OTP; sets `phoneVerified` + legacy trust timestamps. Requires session. */
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

  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const result = await verifyAuthPhoneCodeForUser({
    userId: session.id,
    phoneDigits: phone,
    codeRaw,
  });

  if (!result.ok) {
    const status =
      result.reason === "expired" ? 410
      : result.reason === "wrong_phone" ? 400
      : 400;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }

  return NextResponse.json({ ok: true });
}
