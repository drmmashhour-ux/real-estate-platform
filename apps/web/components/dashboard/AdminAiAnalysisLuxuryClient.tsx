"use client";

import Link from "next/link";

const analysisCards = [
  {
    title: "Top Performing Hub",
    value: "BNHub",
    text: "BNHub is leading revenue growth today with strong booking velocity and stable payout behavior.",
    hrefKey: "bnhub" as const,
  },
  {
    title: "Weakness detected",
    value: "Seller Hub",
    text: "Two draft listings show incomplete data and lower-than-expected engagement.",
    hrefKey: "seller" as const,
  },
  {
    title: "Fastest growth zone",
    value: "Westmount",
    text: "High-value searches and investor activity are both increasing in this market.",
    hrefKey: "buyer" as const,
  },
  {
    title: "Recommended action",
    value: "Promote broker leads",
    text: "Investor-type lead demand is rising. Highlight premium lead inventory in broker workflows.",
    hrefKey: "broker" as const,
  },
];

const recommendations = [
  "Increase visibility for premium BNHub stays in top-demand zones.",
  "Push seller listing quality nudges for low-completion drafts.",
  "Surface more investor-targeted broker leads in Montréal central areas.",
];

type Props = {
  adminBase: string;
  dashBase: string;
};

export function AdminAiAnalysisLuxuryClient({ adminBase, dashBase }: Props) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/78">AI analysis center</div>
            <h1 className="mt-3 text-4xl font-semibold text-white">Platform intelligence</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              AI-generated operational insight across all hubs, including performance trends, weaknesses, growth zones, and recommendations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${adminBase}/analytics`}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:border-[#D4AF37]/35"
            >
              Analytics module
            </Link>
            <Link
              href={`${adminBase}/ai-actions`}
              className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black hover:brightness-110"
            >
              AI actions
            </Link>
            <Link href={`${dashBase}/admin/automation`} className="rounded-full border border-[#D4AF37]/30 px-4 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10">
              Automation
            </Link>
            <Link href={adminBase} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/55 hover:text-[#D4AF37]">
              ← Home
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {analysisCards.map((card) => (
            <Link
              key={card.title}
              href={`${adminBase}/hubs/${card.hrefKey}`}
              className="block rounded-[28px] border border-[#D4AF37]/14 bg-[linear-gradient(135deg,#0D0D0D,#090909)] p-6 transition hover:border-[#D4AF37]/40"
            >
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">{card.title}</div>
              <div className="mt-3 text-2xl font-semibold text-white">{card.value}</div>
              <p className="mt-4 text-sm leading-7 text-white/60">{card.text}</p>
              <span className="mt-4 inline-block text-xs text-[#D4AF37]/80">Open hub →</span>
            </Link>
          ))}
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-[30px] border border-white/8 bg-[#0B0B0B] p-6">
            <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Trend screen</div>
            <div className="flex h-[320px] items-center justify-center rounded-[24px] border border-white/8 bg-[#111111] text-sm text-white/35">
              AI performance trend charts go here
            </div>
          </div>

          <div className="rounded-[30px] border border-white/8 bg-[#0B0B0B] p-6">
            <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">AI Recommendations</div>
            <div className="space-y-4">
              {recommendations.map((line) => (
                <div
                  key={line}
                  className="rounded-2xl border border-white/8 bg-[#111111] px-4 py-4 text-sm text-white/70"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </section>

        <p className="mt-8 text-xs text-white/35">
          Narrative insights are illustrative — connect your models and KPI store for production-grade analysis.
        </p>
      </div>
    </main>
  );
}
