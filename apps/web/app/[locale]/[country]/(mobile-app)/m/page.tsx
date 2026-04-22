import Link from "next/link";

export default async function MobileAppHomePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}`;

  return (
    <div className="flex flex-col gap-8 px-4 pb-8 pt-6">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]/85">LECIPM</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Command your move</h1>
        <p className="mt-2 text-sm text-white/50">Mobile-first workspace — browse, save, book, invest.</p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {[
          { label: "Market pulse", href: `${base}/listings`, desc: "New & featured" },
          { label: "BNHub stays", href: `${base}/bnhub`, desc: "Short trips" },
          { label: "Sell", href: `${base}/sell`, desc: "List a home" },
          { label: "Invest", href: `${base}/investor`, desc: "Portfolios" },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-white/10 bg-[#0D0D0D] px-4 py-4 transition active:scale-[0.99]"
          >
            <div className="text-[11px] uppercase tracking-wide text-[#D4AF37]/80">{card.desc}</div>
            <div className="mt-2 text-base font-medium text-white">{card.label}</div>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-white/70">Spotlight</h2>
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#111] to-black p-5">
          <p className="text-sm text-white/65">Premium inventory in Ville-Marie — save a search and we will nudge you when velocity shifts.</p>
          <Link href={`${base}/m/search`} className="mt-4 inline-block text-sm font-medium text-[#D4AF37]">
            Open search →
          </Link>
        </div>
      </section>
    </div>
  );
}
