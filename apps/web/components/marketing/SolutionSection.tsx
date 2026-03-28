import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const solutions = [
  {
    title: "Verifies your listing data",
    body: "Catch address, unit, and field-level issues before they go public.",
  },
  {
    title: "Checks seller declaration completeness",
    body: "Surface missing disclosures and legal gaps early.",
  },
  {
    title: "Confirms broker credibility",
    body: "Broker verification signals professionalism to buyers.",
  },
  {
    title: "Scores trust and readiness",
    body: "A clear score and checklist — before you even publish.",
  },
];

export function SolutionSection() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The solution"
          title="LECIPM fixes this automatically"
          subtitle="Verification, readiness, and trust signals — integrated into your workflow."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {solutions.map((s, i) => (
            <AnimatedReveal key={s.title} delayMs={i * 80}>
              <div className="flex gap-4 rounded-2xl border border-premium-gold/20 bg-gradient-to-br from-premium-gold/5 to-transparent p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-premium-gold/20 text-sm font-bold text-premium-gold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{s.body}</p>
                </div>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
