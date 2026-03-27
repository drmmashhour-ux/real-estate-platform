import type { Prisma } from "@prisma/client";
import {
  BnhubMpAccountRole,
  BnhubMpOnboardingStatus,
  BnhubMpProcessor,
  BnhubMpVerificationState,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getMarketplacePaymentProcessor } from "@/modules/bnhub-payments/connectors/paymentProcessorFactory";

/**
 * Mirrors host Stripe Connect state into `bnhub_payment_accounts` for marketplace audit trail.
 * Primary onboarding still uses `User.stripeAccountId` + existing host flows; this row is additive.
 */
export async function syncHostAccountFromUserStripe(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeAccountId: true,
      stripeOnboardingComplete: true,
    },
  });
  if (!user?.stripeAccountId) return;

  const processor = getMarketplacePaymentProcessor("stripe");
  const status = await processor.getAccountStatus(user.stripeAccountId);
  if ("error" in status) return;

  const onboarding: BnhubMpOnboardingStatus = status.onboardingComplete
    ? BnhubMpOnboardingStatus.ACTIVE
    : BnhubMpOnboardingStatus.PENDING;

  await prisma.bnhubPaymentAccount.upsert({
    where: {
      userId_processor_roleType: {
        userId,
        processor: BnhubMpProcessor.STRIPE,
        roleType: BnhubMpAccountRole.HOST,
      },
    },
    create: {
      userId,
      processor: BnhubMpProcessor.STRIPE,
      roleType: BnhubMpAccountRole.HOST,
      processorAccountId: user.stripeAccountId,
      onboardingStatus: onboarding,
      payoutsEnabled: status.payoutsEnabled,
      chargesEnabled: status.chargesEnabled,
      requirementsJson: status.requirementsJson as Prisma.InputJsonValue,
      verificationStatus: status.payoutsEnabled
        ? BnhubMpVerificationState.VERIFIED
        : BnhubMpVerificationState.PENDING,
    },
    update: {
      onboardingStatus: onboarding,
      payoutsEnabled: status.payoutsEnabled,
      chargesEnabled: status.chargesEnabled,
      requirementsJson: status.requirementsJson as Prisma.InputJsonValue,
      verificationStatus: status.payoutsEnabled
        ? BnhubMpVerificationState.VERIFIED
        : BnhubMpVerificationState.PENDING,
    },
  });
}

export async function createHostedOnboardingLink(params: {
  stripeAccountId: string;
  refreshUrl: string;
  returnUrl: string;
}) {
  const processor = getMarketplacePaymentProcessor("stripe");
  return processor.createHostedOnboardingLink({
    accountId: params.stripeAccountId,
    refreshUrl: params.refreshUrl,
    returnUrl: params.returnUrl,
  });
}

export async function refreshAccountStatus(userId: string) {
  await syncHostAccountFromUserStripe(userId);
}

export async function markVerificationState(
  userId: string,
  state: BnhubMpVerificationState
) {
  await prisma.bnhubPaymentAccount.updateMany({
    where: { userId, processor: BnhubMpProcessor.STRIPE, roleType: BnhubMpAccountRole.HOST },
    data: { verificationStatus: state },
  });
}

/** Placeholder: production creates Custom account via Stripe API + persists id. */
export async function createHostConnectedAccount(_userId: string): Promise<{ error: string }> {
  return { error: "Use existing BNHub host Stripe Connect onboarding; account creation stays on platform user record." };
}
