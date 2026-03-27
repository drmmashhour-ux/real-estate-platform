import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const pillars = [
  {
    title: "Trust Score",
    body: "Know instantly if your listing is strong or risky.",
  },
  {
    title: "Seller Readiness",
    body: "See exactly what’s missing before going live.",
  },
  {
    title: "Verified Badge",
    body: "Stand out and attract more serious buyers.",
  },
  {
    title: "Smart Alerts",
    body: "Fix problems before they cost you deals.",
  },
];

export function TrustVerificationPillarsSection() {
  return (
    <section id="trust-pillars" className="scroll-mt-24 border-y border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Why LECIPM"
          title="Verification that buyers can see"
          subtitle="Keep it simple: score, readiness, badge, and alerts — before you publish."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <AnimatedReveal key={p.title} delayMs={i * 50}>
              <div className="h-full rounded-2xl border border-[#C9A646]/20 bg-gradient-to-b from-[#C9A646]/[0.07] to-transparent p-6 transition hover:border-[#C9A646]/35">
                <h3 className="text-base font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.body}</p>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
