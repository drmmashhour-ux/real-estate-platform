import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verificationLevelFromFlags } from "@/lib/trust/validators";

/**
 * Keeps `UserVerificationProfile` aligned with authoritative User / broker / identity rows.
 */
export async function syncUserVerificationProfile(userId: string): Promise<void> {
  const [user, identity, broker] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        stripeOnboardingComplete: true,
        stripeChargesEnabled: true,
      },
    }),
    prisma.identityVerification.findUnique({
      where: { userId },
      select: { verificationStatus: true },
    }),
    prisma.brokerVerification.findUnique({
      where: { userId },
      select: { verificationStatus: true },
    }),
  ]);
  if (!user) return;

  const emailVerified = user.emailVerifiedAt != null;
  const phoneVerified = user.phoneVerifiedAt != null;
  const identityVerified = identity?.verificationStatus === VerificationStatus.VERIFIED;
  const brokerVerified = broker?.verificationStatus === VerificationStatus.VERIFIED;
  const paymentVerified = Boolean(user.stripeOnboardingComplete && user.stripeChargesEnabled);

  const verificationLevel = verificationLevelFromFlags({
    emailVerified,
    phoneVerified,
    identityVerified,
    brokerVerified,
    paymentVerified,
  });

  await prisma.userVerificationProfile.upsert({
    where: { userId },
    create: {
      userId,
      emailVerified,
      phoneVerified,
      identityVerified,
      brokerVerified,
      paymentVerified,
      verificationLevel,
    },
    update: {
      emailVerified,
      phoneVerified,
      identityVerified,
      brokerVerified,
      paymentVerified,
      verificationLevel,
    },
  });
}
