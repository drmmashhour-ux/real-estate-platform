import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getContactVerificationStatus } from "@/lib/account/contact-verification-service";

/** GET — email/phone verification flags (no PII beyond masked hints). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const s = await getContactVerificationStatus(userId);
  if (!s) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    emailVerified: s.emailVerified,
    phoneVerified: s.phoneVerified,
    hasPhoneOnFile: Boolean(s.phone?.trim()),
    smsDeliveryConfigured: s.smsConfigured,
  });
}
