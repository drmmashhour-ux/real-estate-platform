import Link from "next/link";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const points = [
  "Verified hosts",
  "Verified listings",
  "Risk scoring before booking",
];

export function BnhubTrustSection() {
  return (
    <section id="bnhub-trust" className="scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <AnimatedReveal>
          <div className="rounded-3xl border border-[#C9A646]/25 bg-gradient-to-br from-[#C9A646]/[0.12] via-black/40 to-black p-8 shadow-[0_0_60px_rgba(201,166,70,0.12)] sm:p-12">
            <SectionHeading
              eyebrow="BNHub"
              title="Short-term rentals you can actually trust"
              subtitle="Safer than traditional platforms — verification and risk signals built in."
            />
            <ul className="mt-8 space-y-3 text-slate-300">
              {points.map((line) => (
                <li key={line} className="flex items-start gap-3 text-base">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A646]" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm font-medium text-[#C9A646]/90">Safer than traditional platforms.</p>
            <Link
              href="/rent"
              className="mt-8 inline-flex items-center justify-center rounded-full border border-[#C9A646]/50 bg-[#C9A646]/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-[#C9A646] hover:bg-[#C9A646]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A646]/50"
            >
              Explore BNHub rentals →
            </Link>
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
