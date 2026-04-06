/**
 * Growth onboarding email — uses existing transactional senders (no duplicate providers).
 */
import { sendAccountVerificationEmail } from "@/lib/email/send";

export async function sendGrowthWelcomeSequence(input: {
  email: string;
  name: string | null;
  verificationToken: string;
  baseUrl: string;
}): Promise<void> {
  const base = input.baseUrl.replace(/\/$/, "");
  const verifyUrl = `${base}/auth/verify-email?token=${encodeURIComponent(input.verificationToken)}`;
  await sendAccountVerificationEmail(input.email, verifyUrl);
}
