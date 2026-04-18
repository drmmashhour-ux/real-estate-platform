import Link from "next/link";
import { hostEconomicsFlags } from "@/config/feature-flags";
import { redirect } from "next/navigation";
import { HostLeadCaptureForm } from "@/components/hosts/HostLeadCaptureForm";

export const dynamic = "force-dynamic";

export default function HostsGetStartedPage() {
  if (!hostEconomicsFlags.hostOnboardingFunnelV1) {
    redirect("/hosts");
  }

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-premium-gold">Hosts</p>
      <h1 className="mt-4 font-serif text-3xl text-white">Get started</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400">
        Tell us how to reach you. We’ll store your listing URL for import review — automated parsing is not guaranteed.
      </p>
      <div className="mt-10">
        <HostLeadCaptureForm />
      </div>
      <Link href="/hosts/onboarding" className="mt-10 inline-block text-sm text-amber-300 hover:text-amber-200">
        Continue to step-by-step onboarding →
      </Link>
    </main>
  );
}
