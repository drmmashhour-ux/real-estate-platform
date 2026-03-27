import type { Metadata } from "next";
import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";
import { HelpAccordions } from "./help-accordions";

export const metadata: Metadata = {
  title: "Help center",
  description: `Booking, selling, broker services, evaluations, and support — ${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME}) help center.`,
};

export default function HelpCenterPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A646]">Support</p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Help center</h1>
          <p className="mt-4 text-[#B3B3B3]">
            Quick answers about BNHub, selling, brokers, and evaluations.
          </p>
          <nav className="mt-8 flex flex-wrap gap-2 text-xs">
            {[
              ["booking", "Booking & payments"],
              ["selling", "Selling"],
              ["broker", "Broker"],
              ["evaluation", "Evaluation"],
              ["contact", "Contact"],
            ].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full border border-[#C9A646]/30 px-3 py-1.5 text-[#C9A646] hover:bg-[#C9A646]/10"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <HelpAccordions />
        <p className="mt-12 text-center">
          <Link href="/" className="text-sm font-semibold text-[#C9A646] hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
