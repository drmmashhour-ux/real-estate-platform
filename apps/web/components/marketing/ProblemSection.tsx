import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const problems = [
  {
    title: "Wrong or incomplete addresses",
    body: "Small data errors erode confidence before the first showing.",
  },
  {
    title: "Missing legal disclosures",
    body: "Gaps in declarations create risk and slow everything down.",
  },
  {
    title: "Poor or misleading photos",
    body: "Visual gaps make buyers hesitate — even when the home is great.",
  },
  {
    title: "No trust signal",
    body: "Listings look “fine” on the surface but don’t prove they’re safe.",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The problem"
          title="Most listings fail before buyers even see them"
          subtitle="Buyers hesitate. Deals slow down. Trust drops."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p, i) => (
            <AnimatedReveal key={p.title} delayMs={i * 60}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{p.body}</p>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
