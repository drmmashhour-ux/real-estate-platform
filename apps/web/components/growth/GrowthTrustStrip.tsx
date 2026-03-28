/** Conversion trust badges + “free service” highlight — reusable on landings. */
export function GrowthTrustStrip() {
  return (
    <div className="rounded-2xl border border-premium-gold/25 bg-[#0B0B0B] px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-premium-gold">Free to get started</p>
          <p className="mt-1 text-sm text-white/85">
            Many tools and first consultations on LECIPM are free. Paid services are always disclosed upfront.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-white/70">
          <span className="rounded-full border border-white/15 px-3 py-1">SSL & secure forms</span>
          <span className="rounded-full border border-white/15 px-3 py-1">Quebec-focused platform</span>
          <span className="rounded-full border border-white/15 px-3 py-1">Verified flows</span>
        </div>
      </div>
    </div>
  );
}

export function GrowthTestimonialsStrip() {
  const items = [
    {
      quote: "Fast responses and clear next steps for our Montreal purchase.",
      who: "Buyer — verified flow",
    },
    {
      quote: "BNHub booking was smooth; host communication was excellent.",
      who: "Travel guest",
    },
    {
      quote: "Mortgage expert walked us through pre-approval without pressure.",
      who: "First-time buyer",
    },
  ];
  return (
    <section className="border-t border-white/10 bg-black/40 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-premium-gold">Testimonials</p>
        <h2 className="mt-2 text-center text-2xl font-bold text-white">Trusted by clients across the platform</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((t) => (
            <blockquote
              key={t.who}
              className="rounded-xl border border-white/10 bg-[#111] p-5 text-left shadow-lg shadow-black/30"
            >
              <p className="text-sm italic text-white/90">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-3 text-xs text-premium-gold">{t.who}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
