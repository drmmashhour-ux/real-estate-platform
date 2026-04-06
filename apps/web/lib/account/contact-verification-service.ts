import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/provider";
import { sendTwilioSms, isTwilioSmsConfigured } from "@/modules/messaging/services/twilio-sms";
import { isDemoMode } from "@/lib/demo-mode";

const OTP_TTL_MS = 15 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 4;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 8;

export type ContactChannel = "EMAIL" | "SMS";

function otpPepper(): string {
  return (
    process.env.CONTACT_OTP_PEPPER?.trim() ||
    process.env.COOKIE_SECRET?.trim() ||
    "lecipm-dev-contact-otp-pepper-change-me"
  );
}

export function hashContactOtp(code: string, userId: string, channel: ContactChannel): string {
  return createHash("sha256")
    .update(`${otpPepper()}|${userId}|${channel}|${code}`)
    .digest("hex");
}

export function generateSixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Normalize to E.164 when possible (US +1 default for 10-digit). */
export function normalizePhoneE164(input: string): string | null {
  const raw = input.trim().replace(/[\s().-]/g, "");
  if (!raw) return null;
  if (raw.startsWith("+")) {
    const digits = raw.slice(1).replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

function maskEmail(email: string): string {
  const [a, d] = email.split("@");
  if (!d) return "***";
  const show = a.slice(0, 2);
  return `${show}***@${d}`;
}

function maskPhone(e164: string): string {
  const d = e164.replace(/\D/g, "");
  if (d.length < 4) return "****";
  return `***${d.slice(-4)}`;
}

async function countRecentSends(userId: string, channel: ContactChannel): Promise<number> {
  const since = new Date(Date.now() - SEND_WINDOW_MS);
  return prisma.contactVerificationCode.count({
    where: { userId, channel, createdAt: { gte: since } },
  });
}

async function invalidatePending(userId: string, channel: ContactChannel) {
  await prisma.contactVerificationCode.updateMany({
    where: { userId, channel, consumedAt: null },
    data: { consumedAt: new Date() },
  });
}

export type SendContactOtpResult =
  | { ok: true; channel: ContactChannel; destinationMask: string; devCode?: string }
  | { ok: false; error: string; code?: string };

/**
 * Issue a new 6-digit code and send by email (account email) or SMS (E.164).
 */
export async function sendContactVerificationOtp(params: {
  userId: string;
  channel: ContactChannel;
  /** Required for SMS if profile has no phone; must normalize to same E.164 on confirm. */
  phone?: string | null;
}): Promise<SendContactOtpResult> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, email: true, phone: true, emailVerifiedAt: true, phoneVerifiedAt: true },
  });
  if (!user) return { ok: false, error: "User not found", code: "NOT_FOUND" };

  const recent = await countRecentSends(params.userId, params.channel);
  if (recent >= MAX_SENDS_PER_WINDOW) {
    return { ok: false, error: "Too many codes requested. Try again later.", code: "RATE_LIMIT" };
  }

  let destinationMask: string;
  let smsTarget: string | null = null;

  if (params.channel === "EMAIL") {
    destinationMask = maskEmail(user.email);
    smsTarget = null;
  } else {
    const e164 =
      normalizePhoneE164(params.phone?.trim() ?? "") ?? normalizePhoneE164(user.phone ?? "");
    if (!e164) {
      return {
        ok: false,
        error: "Add a mobile number or pass phone in international format (e.g. +1…).",
        code: "PHONE_REQUIRED",
      };
    }
    smsTarget = e164;
    destinationMask = maskPhone(e164);
  }

  await invalidatePending(params.userId, params.channel);

  const code = generateSixDigitCode();
  const codeHash = hashContactOtp(code, params.userId, params.channel);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.contactVerificationCode.create({
    data: {
      userId: params.userId,
      channel: params.channel,
      codeHash,
      expiresAt,
      smsTargetE164: smsTarget,
    },
  });

  if (params.channel === "EMAIL") {
    const html = `<p>Your LECIPM verification code is:</p>
<p style="font-size:22px;font-weight:bold;letter-spacing:0.25em;font-family:monospace;">${code}</p>
<p style="color:#737373;font-size:12px;">Expires in 15 minutes. If you did not request this, you can ignore this email.</p>`;
    const sent = await sendTransactionalEmail({
      to: user.email,
      subject: "LECIPM — your verification code",
      html,
      template: "contact_verification_email",
    });
    if (!sent && !isDemoMode()) {
      return { ok: false, error: "Email could not be sent. Check email provider configuration.", code: "EMAIL_SEND" };
    }
  } else {
    const body = `LECIPM code: ${code} (15 min)`;
    if (isDemoMode()) {
      console.info("[contact-otp] DEMO SMS skipped; code for", destinationMask, code);
    } else {
      const r = await sendTwilioSms({ toE164: smsTarget!, body });
      if (!r.ok && r.error !== "NOT_CONFIGURED") {
        return { ok: false, error: r.error ?? "SMS failed", code: "SMS_SEND" };
      }
      if (!r.ok && r.error === "NOT_CONFIGURED") {
        console.info("[contact-otp] Twilio not configured; SMS not sent. Code (dev):", code);
      }
    }
  }

  const out: SendContactOtpResult = {
    ok: true,
    channel: params.channel,
    destinationMask,
  };
  if (process.env.NODE_ENV === "development" || isDemoMode()) {
    out.devCode = code;
  }
  return out;
}

export type ConfirmContactOtpResult =
  | { ok: true; channel: ContactChannel }
  | { ok: false; error: string; code?: string };

/**
 * Confirm code; sets emailVerifiedAt and/or phoneVerifiedAt and updates phone when SMS.
 */
export async function confirmContactVerificationOtp(params: {
  userId: string;
  channel: ContactChannel;
  code: string;
}): Promise<ConfirmContactOtpResult> {
  const raw = params.code.replace(/\D/g, "");
  if (raw.length !== 6) {
    return { ok: false, error: "Enter the 6-digit code.", code: "INVALID_FORMAT" };
  }

  const row = await prisma.contactVerificationCode.findFirst({
    where: {
      userId: params.userId,
      channel: params.channel,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    return { ok: false, error: "No active code. Request a new one.", code: "NO_CODE" };
  }

  if (row.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    await prisma.contactVerificationCode.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    });
    return { ok: false, error: "Too many failed attempts. Request a new code.", code: "LOCKED" };
  }

  const expected = hashContactOtp(raw, params.userId, params.channel);
  if (expected !== row.codeHash) {
    await prisma.contactVerificationCode.update({
      where: { id: row.id },
      data: { failedAttempts: { increment: 1 } },
    });
    return { ok: false, error: "Incorrect code.", code: "MISMATCH" };
  }

  await prisma.contactVerificationCode.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });

  if (params.channel === "EMAIL") {
    await prisma.user.update({
      where: { id: params.userId },
      data: { emailVerifiedAt: new Date() },
    });
  } else {
    const e164 = row.smsTargetE164;
    if (!e164) {
      return { ok: false, error: "Invalid SMS verification record.", code: "INTERNAL" };
    }
    await prisma.user.update({
      where: { id: params.userId },
      data: {
        phone: e164,
        phoneVerifiedAt: new Date(),
      },
    });
  }

  return { ok: true, channel: params.channel };
}

export async function getContactVerificationStatus(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerifiedAt: true,
      phone: true,
      phoneVerifiedAt: true,
    },
  });
  if (!u) return null;
  return {
    email: u.email,
    emailVerified: Boolean(u.emailVerifiedAt),
    phone: u.phone,
    phoneVerified: Boolean(u.phoneVerifiedAt),
    smsConfigured: isTwilioSmsConfigured(),
  };
}
