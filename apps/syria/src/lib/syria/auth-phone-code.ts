import { randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashOtpCode } from "@/lib/anti-fraud/phone-otp";
import { recomputeReputationScoreForUser } from "@/lib/syria/user-reputation";
import { adjustTrustScore } from "@/lib/sybnb/trust-score";

const CODE_TTL_MS = 5 * 60 * 1000;

/** ORDER SYBNB-96 — 6-digit numeric code (fits 4–6 digit UX requirement). */
function generateNumericCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

export type SendAuthPhoneCodeResult = { ok: true; codeForSms: string } | { ok: false; reason: "validation" };

/**
 * ORDER SYBNB-96 — store hashed OTP on `SyriaAppUser` with 5-minute expiry.
 * Caller must have resolved `userId` (session or guest-by-phone).
 */
export async function sendAuthPhoneCodeForUser(opts: {
  userId: string;
  phoneDigits: string;
}): Promise<SendAuthPhoneCodeResult> {
  const phoneDigits = opts.phoneDigits.trim();
  if (phoneDigits.length < 8) {
    return { ok: false, reason: "validation" };
  }

  const code = generateNumericCode();
  const hash = hashOtpCode(code);
  const expiry = new Date(Date.now() + CODE_TTL_MS);

  await prisma.syriaAppUser.update({
    where: { id: opts.userId },
    data: {
      phone: phoneDigits,
      phoneCode: hash,
      phoneCodeExpiry: expiry,
    },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[SYBNB-96 auth/send-code] OTP for testing:", code);
  }

  return { ok: true, codeForSms: code };
}

export type VerifyAuthPhoneCodeResult =
  | { ok: true }
  | { ok: false; reason: "validation" | "bad_code" | "expired" | "wrong_phone" };

/**
 * ORDER SYBNB-96 — verify pending OTP for the signed-in user only (session-bound).
 */
export async function verifyAuthPhoneCodeForUser(opts: {
  userId: string;
  phoneDigits: string;
  codeRaw: string;
}): Promise<VerifyAuthPhoneCodeResult> {
  const phoneDigits = opts.phoneDigits.trim();
  const code = String(opts.codeRaw ?? "").replace(/\D/g, "").trim();
  if (phoneDigits.length < 8 || code.length < 4 || code.length > 8) {
    return { ok: false, reason: "validation" };
  }

  const user = await prisma.syriaAppUser.findUnique({
    where: { id: opts.userId },
    select: { phone: true, phoneCode: true, phoneCodeExpiry: true, phoneVerifiedAt: true },
  });
  if (!user?.phoneCode || !user.phoneCodeExpiry) {
    return { ok: false, reason: "bad_code" };
  }
  const storedPhone = (user.phone ?? "").trim().replace(/\D/g, "");
  if (storedPhone !== phoneDigits) {
    return { ok: false, reason: "wrong_phone" };
  }
  if (user.phoneCodeExpiry.getTime() < Date.now()) {
    await prisma.syriaAppUser.update({
      where: { id: opts.userId },
      data: { phoneCode: null, phoneCodeExpiry: null },
    });
    return { ok: false, reason: "expired" };
  }
  if (user.phoneCode !== hashOtpCode(code)) {
    return { ok: false, reason: "bad_code" };
  }

  const now = new Date();
  const wasUnverified = user.phoneVerifiedAt == null;
  await prisma.syriaAppUser.update({
    where: { id: opts.userId },
    data: {
      phoneVerified: true,
      phoneVerifiedAt: now,
      verifiedAt: now,
      verificationLevel: "phone",
      phoneCode: null,
      phoneCodeExpiry: null,
    },
  });

  await recomputeReputationScoreForUser(opts.userId);
  if (wasUnverified) {
    await adjustTrustScore(opts.userId, 3);
  }

  return { ok: true };
}
