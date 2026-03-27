import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { MarketplaceOnboardingLayout } from "@/components/marketplace/MarketplaceOnboardingLayout";
import { MarketplaceOnboardingForm } from "@/components/marketplace/MarketplaceOnboardingForm";
import { dashboardPathForPersona } from "@/lib/marketplace/persona";

export const dynamic = "force-dynamic";

export default async function OnboardingSellerPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/onboarding/seller");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { marketplacePersona: true },
  });
  if (user?.marketplacePersona === "SELLER_DIRECT") {
    redirect(dashboardPathForPersona("SELLER_DIRECT"));
  }

  return (
    <MarketplaceOnboardingLayout
      title="Seller (DIY) onboarding"
      description="Choose how much help you want. Next you will verify identity and property details before listings go live."
    >
      <MarketplaceOnboardingForm
        persona="SELLER_DIRECT"
        redirectPath="/dashboard/seller"
        showSellerPlan
      />
    </MarketplaceOnboardingLayout>
  );
}
