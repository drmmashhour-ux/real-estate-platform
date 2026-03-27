import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const steps = [
  {
    n: "01",
    title: "Add client",
    body: "Capture intake, assign ownership, and keep everyone on the same record.",
  },
  {
    n: "02",
    title: "Create deal",
    body: "Open a deal workspace — pipeline stage, key dates, and participants in one view.",
  },
  {
    n: "03",
    title: "Upload documents",
    body: "Drop files into the deal room with version context and audit trail.",
  },
  {
    n: "04",
    title: "Manage offers & contracts",
    body: "Negotiate offers, generate contracts, and track signatures without leaving the thread.",
  },
  {
    n: "05",
    title: "Close deal",
    body: "Finalize commissions, invoices, and handoff — with analytics for the next one.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-y border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title="Five steps. One connected flow."
          subtitle="Repeatable on every transaction — from intake to closed commission."
        />
        <div className="relative">
          <div className="absolute left-[1.35rem] top-0 hidden h-full w-px bg-gradient-to-b from-[#C9A646]/60 via-white/10 to-transparent md:block" aria-hidden />
          <ol className="space-y-8">
            {steps.map((s, i) => (
              <AnimatedReveal key={s.n} delayMs={i * 70}>
                <li className="relative flex flex-col gap-3 md:flex-row md:items-start md:gap-8">
                  <div className="flex items-center gap-3 md:w-40 md:shrink-0">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C9A646]/40 bg-[#C9A646]/10 text-sm font-bold text-[#C9A646]">
                      {s.n}
                    </span>
                    <span className="font-serif text-lg font-semibold text-white md:hidden">{s.title}</span>
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-black/30 p-6">
                    <h3 className="hidden font-serif text-xl font-semibold text-white md:block">{s.title}</h3>
                    <p className="mt-0 text-sm text-slate-400 md:mt-2">{s.body}</p>
                  </div>
                </li>
              </AnimatedReveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
