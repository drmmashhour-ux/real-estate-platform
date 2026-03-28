import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const points = [
  {
    title: "Full workflow coverage",
    body: "CRM through commissions — not a point solution that stops at listings.",
  },
  {
    title: "Agency-ready architecture",
    body: "Multi-tenant patterns built for growing brokerages and distributed teams.",
  },
  {
    title: "Communication + documents",
    body: "Threads and deal rooms stay linked to the same record — no orphan files.",
  },
  {
    title: "Finance visibility",
    body: "See revenue, payouts, and tax-facing artifacts without leaving the hub.",
  },
  {
    title: "Command-center analytics",
    body: "Operational KPIs for leadership — not just marketing vanity metrics.",
  },
];

export function WhyUsSection() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Why LECIPM"
          title="Built different — on purpose"
          subtitle="We didn’t stitch together off-the-shelf widgets. We engineered an operating layer for real estate."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {points.map((p, i) => (
            <AnimatedReveal key={p.title} delayMs={i * 50}>
              <div className="h-full rounded-2xl border border-white/10 bg-black/40 p-6">
                <div className="mb-3 h-1 w-12 rounded-full bg-premium-gold" />
                <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{p.body}</p>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
