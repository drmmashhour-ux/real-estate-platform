import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";
import { PLATFORM_NAME } from "@/config/branding";

const points = [
  "Verified listings (trust-first approach)",
  "Direct sellers + brokers in one system",
  "Built-in legal structure and compliance",
  "AI-powered decision support",
  "Lower costs than traditional models",
];

export function DifferentiatorsSection() {
  return (
    <section id="differentiators" className="scroll-mt-24 border-y border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={`Why ${PLATFORM_NAME}`}
          title="Unlike existing platforms"
          subtitle="Designed for trust, clarity, and outcomes — not another disconnected stack of tools."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((line, i) => (
            <AnimatedReveal key={line} delayMs={i * 50}>
              <div className="h-full rounded-2xl border border-white/10 bg-black/30 p-6">
                <p className="text-sm leading-relaxed text-slate-200">{line}</p>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
