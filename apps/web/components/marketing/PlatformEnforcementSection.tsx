import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const rules = [
  "Seller declaration (mandatory)",
  "Document verification",
  "Contract signing before actions",
  "User legal acknowledgment",
  "Structured drafting system",
];

export function PlatformEnforcementSection() {
  return (
    <section id="compliance" className="scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Compliance & trust" title="Platform enforces" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map((line, i) => (
            <AnimatedReveal key={line} delayMs={i * 45}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <p className="text-sm leading-relaxed text-slate-200">{line}</p>
              </div>
            </AnimatedReveal>
          ))}
        </div>
        <AnimatedReveal delayMs={rules.length * 45}>
          <p className="mt-8 rounded-2xl border border-premium-gold/25 bg-gradient-to-br from-premium-gold/10 to-transparent px-6 py-5 text-center text-sm font-medium text-slate-200 sm:text-base">
            <span className="mr-2 text-premium-gold" aria-hidden>
              →
            </span>
            Built for public protection and compliance
          </p>
        </AnimatedReveal>
      </div>
    </section>
  );
}
