import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BnhubHostOnboardingClient } from "@/components/bnhub/host/BnhubHostOnboardingClient";
import { getGuestId } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "BNHub — Host onboarding",
  description: "Publish your first stay in minutes with BNHub quick onboarding.",
};

export default async function BnhubHostOnboardingPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?next=/bnhub/host/onboarding");
  }

  return (
    <main className="min-h-screen bg-black">
      <BnhubHostOnboardingClient />
    </main>
  );
}
