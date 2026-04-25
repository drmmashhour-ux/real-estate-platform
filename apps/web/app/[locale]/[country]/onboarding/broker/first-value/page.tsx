import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { MarketplaceOnboardingLayout } from "@/components/marketplace/MarketplaceOnboardingLayout";
import { BrokerActivationMoment } from "@/components/broker-onboarding/BrokerActivationMoment";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; country: string }> };

export default async function BrokerFirstValuePage(props: Props) {
  const { locale, country } = await props.params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/onboarding/broker");

  const profile = await prisma.brokerProfile.findUnique({
    where: { userId },
    select: { onboardingCompletedAt: true },
  });
  if (!profile?.onboardingCompletedAt) {
    redirect(`/${locale}/${country}/onboarding/broker`);
  }

  return (
    <MarketplaceOnboardingLayout
      title="Value Shown Immediately"
      description="We've matched your profile to top opportunities in your region. Take your first action below."
    >
      <BrokerActivationMoment locale={locale} country={country} />
    </MarketplaceOnboardingLayout>
  );
}
