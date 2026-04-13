import Link from "next/link";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const demoItems = [
  "Property search",
  "Listing page with financial insights",
  "Seller dashboard (listing + documents)",
  "Contract signing system",
  "Rental booking (NBHub)",
  "Investor dashboard (analytics + AI insights)",
];

export function LiveDemoSection() {
  return (
    <section id="live-demo" className="scroll-mt-24 border-y border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Platform demos" title="What you can try" />
        <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
          {demoItems.map((text, i) => (
            <li key={text}>
              <AnimatedReveal delayMs={i * 40}>
                <div className="flex h-full gap-4 rounded-2xl border border-white/10 bg-black/30 p-5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-premium-gold/40 bg-premium-gold/10 text-sm font-bold text-premium-gold"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span className="pt-1.5 text-sm leading-relaxed text-slate-200">{text}</span>
                </div>
              </AnimatedReveal>
            </li>
          ))}
        </ol>
        <AnimatedReveal delayMs={demoItems.length * 40}>
          <div className="mt-10 flex justify-center">
            <Link
              href="/demos"
              className="inline-flex items-center justify-center rounded-full bg-premium-gold px-8 py-3.5 text-sm font-semibold text-black shadow-lg shadow-premium-gold/20 transition hover:brightness-110"
            >
              Explore all demos
            </Link>
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
