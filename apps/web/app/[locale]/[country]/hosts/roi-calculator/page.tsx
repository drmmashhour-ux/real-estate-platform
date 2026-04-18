import { RoiCalculatorForm } from "@/components/roi/RoiCalculatorForm";
import Link from "next/link";
import { hostEconomicsFlags } from "@/config/feature-flags";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Alias surface — same tool as `/host/roi-calculator` for host-acquisition links. */
export default function HostsRoiCalculatorPage() {
  if (!hostEconomicsFlags.roiCalculatorV1) {
    redirect("/host");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">Host economics</p>
        <h1 className="mt-3 font-serif text-3xl md:text-4xl">Estimate your potential net revenue difference</h1>
        <p className="mt-4 max-w-2xl text-sm text-slate-400">
          Modeled comparison based on your inputs — not a guarantee. Adjust numbers to match your situation.
        </p>
        <Link href="/hosts" className="mt-4 inline-block text-sm text-premium-gold hover:text-[#E8D589]">
          ← Hosts
        </Link>
        <div className="mt-10">
          <RoiCalculatorForm />
        </div>
      </div>
    </main>
  );
}
