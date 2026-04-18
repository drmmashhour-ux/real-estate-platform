import { Container } from "@/components/ui/Container";

/** Illustrative static row — not user-specific; always paired with disclaimer. */
const ROWS = [
  { label: "Annual net to host — modeled scenario A", before: "$50,000", after: "$53,200", note: "Illustrative inputs" },
  { label: "Annual net to host — modeled scenario B", before: "$60,000", after: "$63,800", note: "Illustrative inputs" },
] as const;

export function RoiProofSection() {
  return (
    <section className="border-b border-white/5 bg-landing-black py-14 sm:py-20">
      <Container narrow>
        <h2 className="text-center font-[family-name:var(--font-serif)] text-3xl font-semibold text-white sm:text-4xl">
          See the modeled difference
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-landing-text/75">
          Examples only — not your results. Run the calculator with your own fees and nights.
        </p>
        <div className="mt-10 space-y-4 rounded-2xl border border-white/10 bg-landing-dark/80 p-6 sm:p-8">
          {ROWS.map((r) => (
            <div
              key={r.label}
              className="flex flex-col gap-2 border-b border-white/5 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-white">{r.label}</p>
                <p className="text-xs text-white/45">{r.note}</p>
              </div>
              <div className="flex flex-wrap items-baseline gap-3 text-sm">
                <span className="text-white/50">Before</span>
                <span className="font-semibold text-white/80">{r.before}</span>
                <span className="text-premium-gold">→</span>
                <span className="text-white/50">After (modeled)</span>
                <span className="font-semibold text-premium-gold">{r.after}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs leading-relaxed text-white/45">
          Modeled comparisons depend on your inputs and plan assumptions. Not financial advice. Past or example performance
          does not guarantee future results.
        </p>
      </Container>
    </section>
  );
}
