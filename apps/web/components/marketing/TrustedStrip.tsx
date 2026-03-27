import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const items = [
  "Broker CRM",
  "E-sign contracts",
  "Deal rooms",
  "Commissions",
  "Quebec-ready workflows",
];

export function TrustedStrip() {
  return (
    <section className="border-b border-white/10 bg-white/[0.02] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AnimatedReveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Built for modern brokerages & investment teams
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {items.map((t) => (
              <span key={t} className="text-sm font-medium text-slate-400">
                {t}
              </span>
            ))}
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
