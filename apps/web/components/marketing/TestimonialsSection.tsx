import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

const quotes = [
  {
    quote:
      "We finally stopped losing context between email, drive folders, and three CRMs. One pipeline for the whole deal.",
    name: "Alex M.",
    role: "Managing broker",
  },
  {
    quote:
      "Offers and documents living in the same room as the client conversation — that alone paid for the switch.",
    name: "Sarah L.",
    role: "Agency operations",
  },
  {
    quote:
      "Finance and commissions in the same workspace as the file means fewer surprises at month-end.",
    name: "Jordan P.",
    role: "Team lead",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="scroll-mt-24 border-y border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Trust"
          title="Teams run calmer when the workflow is unified"
          subtitle="Representative feedback from early partners — replace with live testimonials when available."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <AnimatedReveal key={q.name} delayMs={i * 70}>
              <blockquote className="flex h-full flex-col rounded-2xl border border-white/10 bg-black/40 p-6 shadow-lg shadow-black/30">
                <p className="text-sm leading-relaxed text-slate-300">&ldquo;{q.quote}&rdquo;</p>
                <footer className="mt-6 border-t border-white/10 pt-4">
                  <p className="text-sm font-semibold text-white">{q.name}</p>
                  <p className="text-xs text-[#C9A646]/90">{q.role}</p>
                </footer>
              </blockquote>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
