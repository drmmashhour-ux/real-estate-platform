import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GrowthLeadCapture } from "@/components/marketing/GrowthLeadCapture";
import { PLATFORM_DEFAULT_DESCRIPTION, PLATFORM_NAME } from "@/lib/brand/platform";

export const metadata: Metadata = {
  title: "Early access",
  description: `Join ${PLATFORM_NAME} early — better prices, verified stays, or list your property with launch support.`,
  openGraph: {
    title: "Early access",
    description: PLATFORM_DEFAULT_DESCRIPTION,
  },
};

function LeadFormFallback() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-[#121212]/50 p-6 text-sm text-[#737373]">
      Loading form…
    </div>
  );
}

export default function EarlyAccessPage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-2xl px-4 py-16 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">BNHub</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Early access</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">
        Verified stays, fair pricing for guests; visibility and lower friction for hosts. Join the first wave — we
        respond personally.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/bnhub/stays"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-5 text-sm font-semibold text-premium-gold transition hover:bg-premium-gold/20"
        >
          Find your stay
        </Link>
        <Link
          href="/host/apply"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          List your property
        </Link>
      </div>
      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#737373]">
        <li className="flex items-center gap-1.5">
          <span className="text-emerald-500" aria-hidden>
            ✓
          </span>
          Verified listings
        </li>
        <li className="flex items-center gap-1.5">
          <span className="text-emerald-500" aria-hidden>
            ✓
          </span>
          Human support for early users
        </li>
        <li className="flex items-center gap-1.5">
          <span className="text-emerald-500" aria-hidden>
            ✓
          </span>
          Secure payments
        </li>
      </ul>
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#0B0B0B] p-6">
        <Suspense fallback={<LeadFormFallback />}>
          <GrowthLeadCapture />
        </Suspense>
      </div>
      <section className="mt-12 border-t border-white/10 pt-10" aria-labelledby="early-social-proof">
        <h2 id="early-social-proof" className="text-sm font-semibold uppercase tracking-[0.15em] text-[#737373]">
          Early voices
        </h2>
        <p className="mt-2 text-xs text-[#5C5C5C]">
          Replace with real names and quotes as you collect them (see <code className="text-[#737373]">docs/first-1000-users.md</code>
          ).
        </p>
        <ul className="mt-4 space-y-4">
          <li className="rounded-xl border border-white/10 bg-[#121212]/80 p-4 text-sm leading-relaxed text-[#B3B3B3]">
            <q>I wanted clearer pricing before I booked — this actually showed the full picture.</q>
            <footer className="mt-2 text-xs text-[#737373]">— Early guest, pilot city</footer>
          </li>
          <li className="rounded-xl border border-white/10 bg-[#121212]/80 p-4 text-sm leading-relaxed text-[#B3B3B3]">
            <q>Onboarding felt like someone cared about the listing, not just another form.</q>
            <footer className="mt-2 text-xs text-[#737373]">— Early host</footer>
          </li>
        </ul>
      </section>
    </main>
  );
}
