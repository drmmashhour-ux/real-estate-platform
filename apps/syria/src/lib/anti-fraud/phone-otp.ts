import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_SEND_PER_HOUR = 3;

function pepper(): string {
  return process.env.SYRIA_OTP_PEPPER ?? "dev-syria-otp-pepper-change-in-production";
}

export function hashOtpCode(digits: string): string {
  return createHash("sha256")
    .update(pepper() + digits.trim())
    .digest("hex");
}

function generateSixDigits(): string {
  return String(randomInt(100_000, 1_000_000));
}

export async function createAndStorePhoneOtp(
  userId: string,
): Promise<{ ok: true; codeForSms: string } | { ok: false; reason: "send_rate" }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentSends = await prisma.syriaPhoneOtp.count({
    where: { userId, createdAt: { gte: oneHourAgo } },
  });
  if (recentSends >= MAX_SEND_PER_HOUR) {
    return { ok: false, reason: "send_rate" };
  }

  const code = generateSixDigits();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.$transaction([
    prisma.syriaPhoneOtp.deleteMany({ where: { userId } }),
    prisma.syriaPhoneOtp.create({
      data: {
        userId,
        codeHash,
        expiresAt,
      },
    }),
  ]);

  // Integrate SMS/WhatsApp here: send `code` to the user. Never return to browser in production.
  return { ok: true, codeForSms: code };
}

export async function verifyPhoneOtpAndMarkUser(
  userId: string,
  codeRaw: string,
): Promise<{ ok: true } | { ok: false; reason: "bad_code" | "expired" }> {
  const code = String(codeRaw ?? "").replace(/\D/g, "").trim();
  if (code.length < 4 || code.length > 8) {
    return { ok: false, reason: "bad_code" };
  }
  const row = await prisma.syriaPhoneOtp.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return { ok: false, reason: "expired" };
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.syriaPhoneOtp.delete({ where: { id: row.id } }).catch(() => {});
    return { ok: false, reason: "expired" };
  }
  if (row.codeHash !== hashOtpCode(code)) {
    return { ok: false, reason: "bad_code" };
  }
  const now = new Date();
  await prisma.$transaction([
    prisma.syriaPhoneOtp.deleteMany({ where: { userId } }),
    prisma.syriaAppUser.update({
      where: { id: userId },
      data: { phoneVerifiedAt: now },
    }),
  ]);
  return { ok: true };
}
