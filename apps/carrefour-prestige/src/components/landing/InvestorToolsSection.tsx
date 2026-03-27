import { getPlatformAppUrl } from "@/lib/platform-url";

const tools = [
  {
    title: "ROI Calculator",
    description: "Cap rate, yield, and cash-on-cash — deterministic, disclosure-forward outputs.",
    hrefSuffix: "/dashboard/investor",
    icon: "%",
  },
  {
    title: "Welcome Tax Estimator",
    description: "Quebec transfer duty brackets with transparent assumptions and disclaimers.",
    hrefSuffix: "/dashboard/investor",
    icon: "◇",
  },
  {
    title: "Portfolio Tracker",
    description: "Consolidate positions, notes, and performance signals in one workspace.",
    hrefSuffix: "/dashboard/investor",
    icon: "◆",
  },
] as const;

export function InvestorToolsSection() {
  const base = getPlatformAppUrl();

  return (
    <section id="investor-tools" className="border-y border-white/[0.06] bg-[#0B0B0B] py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="font-serif text-3xl text-white md:text-4xl">Investor Tools</h2>
        <p className="mx-auto mt-4 max-w-2xl text-[#CCCCCC]">
          Make smarter decisions with powerful insights
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-8 px-6 md:grid-cols-3">
        {tools.map((t) => (
          <a
            key={t.title}
            href={`${base}${t.hrefSuffix}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-2xl border border-white/[0.08] bg-[#111] p-8 text-left shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition hover:border-[#C9A646]/30"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#0F3D2E]/50 bg-[#0F3D2E]/25 font-serif text-lg text-[#C9A646]"
              aria-hidden
            >
              {t.icon}
            </span>
            <h3 className="mt-6 font-serif text-xl text-white">{t.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[#CCCCCC]/90">{t.description}</p>
            <span className="mt-6 text-xs font-semibold uppercase tracking-widest text-[#C9A646]">
              Open in platform ↗
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
