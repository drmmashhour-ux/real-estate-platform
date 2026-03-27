import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const points = [
  "Full ecosystem implemented",
  "Demo environment ready",
  "Legal + AI systems integrated",
  "Multi-role dashboards operational",
];

export function PlatformBuiltSection() {
  return (
    <section id="platform-status" className="scroll-mt-24 border-y border-white/10 bg-white/[0.02] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Status" title="Platform is already built" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((line, i) => (
            <AnimatedReveal key={line} delayMs={i * 45}>
              <div className="h-full rounded-2xl border border-[#C9A646]/15 bg-black/30 p-6">
                <p className="text-sm leading-relaxed text-slate-200">{line}</p>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
