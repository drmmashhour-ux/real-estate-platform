import { redirect } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { MarketplaceOnboardingLayout } from "@/components/marketplace/MarketplaceOnboardingLayout";
import { BrokerLecipmOnboardingWizard } from "@/components/broker-onboarding/BrokerLecipmOnboardingWizard";
import { BrokerAcquisitionOnboarding } from "@/components/broker-onboarding/BrokerAcquisitionOnboarding";
import { dashboardPathForPersona } from "@/lib/marketplace/persona";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; country: string }> };

export default async function OnboardingBrokerPage(props: Props) {
  const { locale, country } = await props.params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/onboarding/broker");

  const completed = await prisma.launchEvent.findFirst({
    where: { userId, event: "broker_lecipm_onboarding_completed" },
    select: { id: true },
  });
  if (completed) {
    redirect(dashboardPathForPersona("BROKER"));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, phone: true },
  });
  if (!user?.email) redirect("/auth/login?next=/onboarding/broker");

  const profile = await prisma.brokerProfile.findUnique({
    where: { userId },
    select: { onboardingCompletedAt: true, firstValueShownAt: true },
  });

  if (!profile?.onboardingCompletedAt) {
    return (
      <MarketplaceOnboardingLayout
        title="Broker onboarding"
        description="Four quick steps — then we show you example leads and insights so you see value immediately."
      >
        <BrokerAcquisitionOnboarding
          locale={locale}
          country={country}
          initialName={user.name}
          initialPhone={user.phone}
        />
      </MarketplaceOnboardingLayout>
    );
  }

  if (!profile.firstValueShownAt) {
    redirect(`/${locale}/${country}/onboarding/broker/first-value`);
  }

  return (
    <MarketplaceOnboardingLayout
      title="Broker onboarding"
      description="Launch path: profile setup → optional licence verification → first transaction (LEC-SD file) → guided tutorial. Québec-first rollout (OACIQ): finish onboarding to activate reporting and SD workspace."
    >
      <BrokerLecipmOnboardingWizard initialName={user.name} initialEmail={user.email} initialPhone={user.phone} />
    </MarketplaceOnboardingLayout>
  );
}
