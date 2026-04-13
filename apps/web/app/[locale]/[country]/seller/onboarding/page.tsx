import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { SellerOnboardingWizard } from "@/components/seller/SellerOnboardingWizard";

export const dynamic = "force-dynamic";

export default async function SellerOnboardingPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/seller/onboarding");

  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading…</div>}>
      <SellerOnboardingWizard />
    </Suspense>
  );
}
