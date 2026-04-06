import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export function generateReferralCode(prefix = "USER"): string {
  return `${prefix}${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Unique row id for viral / multi-referee attribution (host flow uses its own generator). */
export function generateViralReferralInstanceCode(): string {
  return `V${randomBytes(6).toString("hex").toUpperCase()}`;
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) return user.referralCode;
  const code = generateReferralCode();
  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}
