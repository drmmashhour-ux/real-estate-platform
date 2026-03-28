import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const streams = [
  { label: "Sales", detail: "commission from deals" },
  { label: "Long-term rent", detail: "1 month rent" },
  { label: "Short-term rent", detail: "<2% fee" },
  { label: "Buyer advisory", detail: "paid plans" },
  { label: "Lead generation", detail: "brokers & mortgage agents" },
];

export function RevenueStreamsSection() {
  return (
    <section id="revenue" className="scroll-mt-24 border-y border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Business model"
          title="Multiple revenue streams"
          subtitle="A diversified model aligned with transactions, rentals, advisory, and partner demand."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((s, i) => (
            <AnimatedReveal key={s.label} delayMs={i * 45}>
              <div className="h-full rounded-2xl border border-premium-gold/15 bg-black/30 p-6">
                <h3 className="text-base font-semibold text-white">{s.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  <span className="mr-1.5 text-premium-gold/90" aria-hidden>
                    →
                  </span>
                  {s.detail}
                </p>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
