import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const steps = [
  "Launch staging demo",
  "Onboard first brokers and users",
  "Expand partnerships",
  "Scale marketing and growth",
];

export function NextStepsSection() {
  return (
    <section id="next-steps" className="scroll-mt-24 border-t border-white/10 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Next steps" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((line, i) => (
            <AnimatedReveal key={line} delayMs={i * 45}>
              <div className="flex h-full gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C9A646]/40 bg-[#C9A646]/10 text-xs font-bold text-[#C9A646]"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-slate-200">{line}</p>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
