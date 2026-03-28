import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const asks = [
  "Investment to scale platform",
  "Marketing support",
  "Strategic partnerships",
];

export function LookingForSection() {
  return (
    <section id="looking-for" className="scroll-mt-24 border-y border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="We are looking for" />
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
          {asks.map((line, i) => (
            <AnimatedReveal key={line} delayMs={i * 50}>
              <div className="h-full rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
                <p className="text-sm leading-relaxed text-slate-200">{line}</p>
              </div>
            </AnimatedReveal>
          ))}
        </div>
        <AnimatedReveal delayMs={asks.length * 50}>
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-premium-gold/25 bg-gradient-to-br from-premium-gold/10 to-transparent px-6 py-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Goal</p>
            <p className="mt-3 font-serif text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Build the leading trusted real estate ecosystem
            </p>
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
