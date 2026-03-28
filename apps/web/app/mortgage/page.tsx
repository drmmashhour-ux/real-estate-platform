import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME, platformCarrefourGoldGradientClass } from "@/lib/brand/platform";
import { MvpNav } from "@/components/investment/MvpNav";
import { getPublicMortgageExpertsList } from "@/modules/mortgage/services/public-experts";
import { MortgagePageClient, type MortgagePrefill, type PublicExpert } from "./mortgage-page-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mortgage experts",
  description: "Connect with a mortgage expert — rates, pre-approvals, and financing guidance.",
};

export default async function MortgagePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const purchasePrice = typeof sp.purchasePrice === "string" ? sp.purchasePrice : undefined;
  const purchaseRegion = typeof sp.purchaseRegion === "string" ? sp.purchaseRegion : undefined;
  const prefill: MortgagePrefill | undefined =
    from === "analyze" || purchasePrice || purchaseRegion
      ? {
          from: from === "analyze" ? "analyze" : undefined,
          purchasePrice,
          purchaseRegion,
        }
      : undefined;

  const rows = await getPublicMortgageExpertsList();
  const experts: PublicExpert[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    photo: r.photo,
    company: r.company,
    title: r.title,
    bio: r.bio,
    rating: r.rating,
    reviewCount: r.reviewCount,
    totalDeals: r.totalDeals,
    badges: r.badges,
  }));

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <MvpNav variant="live" />
      <main>
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6">
          <p
            className={`mx-auto max-w-2xl text-[11px] font-bold uppercase leading-snug tracking-[0.12em] sm:text-xs sm:tracking-[0.18em] ${platformCarrefourGoldGradientClass}`}
          >
            {PLATFORM_CARREFOUR_NAME}
          </p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Mortgage experts</h1>
          <p className="mx-auto mt-4 max-w-2xl text-[#B3B3B3]">
            Speak with a licensed specialist. Request contact below — <strong className="text-premium-gold">FREE</strong>, no
            obligation.
          </p>
          <p className="mt-4">
            <Link href="/experts" className="text-sm font-semibold text-premium-gold hover:underline">
              Browse all experts →
            </Link>
          </p>
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-premium-gold/25 bg-[#121212] px-5 py-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">AI layer</p>
            <p className="mt-2 text-sm text-[#B3B3B3]">
              Connect analysis to financing: run scenarios in the{" "}
              <Link href="/analyze" className="font-medium text-premium-gold hover:underline">
                deal analyzer
              </Link>
              , then return here with your numbers — or open the{" "}
              <Link href="/dashboard/ai" className="font-medium text-premium-gold hover:underline">
                AI workspace
              </Link>{" "}
              for drafting questions for your expert.
            </p>
          </div>
        </div>
      </section>
      <MortgagePageClient experts={experts} prefill={prefill} />
      </main>
    </div>
  );
}
