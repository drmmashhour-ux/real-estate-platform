"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AnalyzeLinkButton } from "@/components/marketing/AnalyzeLinkButton";
import { WaitlistEmailCapture } from "@/components/marketing/WaitlistEmailCapture";

function IconSpark() {
  return (
    <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

function IconScale() {
  return (
    <svg className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
      />
    </svg>
  );
}

function benefits(isLoggedIn: boolean) {
  return [
    {
      title: "AI insights",
      body: "Risk scores, ratings, and plain-language takeaways on every analysis.",
      Icon: IconSpark,
      href: "/analyze",
      cta: "Analyze deal",
    },
    {
      title: "Market comparison",
      body: "See how your ROI stacks up against regional benchmarks (illustrative).",
      Icon: IconScale,
      href: isLoggedIn ? "/compare" : "/demo/compare",
      cta: "Compare strategies",
    },
    {
      title: "Portfolio tracking",
      body: "Save deals, view totals, and compare 2–4 opportunities side by side.",
      Icon: IconChart,
      href: isLoggedIn ? "/dashboard" : "/demo/dashboard",
      cta: "View portfolio",
    },
  ] as const;
}

export function InvestmentGrowthHome({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const rows = useMemo(() => benefits(isLoggedIn), [isLoggedIn]);

  useEffect(() => {
    rows.forEach((b) => {
      router.prefetch(b.href);
    });
  }, [router, rows]);

  return (
    <section className="border-t border-emerald-500/20 bg-gradient-to-b from-emerald-950/25 to-[#0B0B0B] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-emerald-500/30 bg-[#0f1412] p-6 shadow-xl shadow-black/40 sm:p-10">
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">Investment tools</p>
          <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Start analyzing your first investment deal now
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-400">
            No login required for the demo — run numbers, save to your browser, and explore your portfolio.
          </p>
          <div className="mt-8 flex justify-center">
            <AnalyzeLinkButton
              href="/analyze"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-emerald-500 px-10 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400"
            >
              Open deal analyzer
            </AnalyzeLinkButton>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {rows.map(({ title, body, Icon, href, cta }) => {
            const aria = `${title}. ${body} ${cta}.`;
            return (
              <Link
                key={title}
                href={href}
                className="group relative z-30 block cursor-pointer rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/70"
                aria-label={aria}
              >
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212]/90 text-center shadow-inner shadow-black/20 transition-colors duration-200 group-hover:border-emerald-500/35 group-hover:shadow-lg group-hover:shadow-emerald-950/30">
                  <div className="relative z-30 cursor-pointer p-6 transition duration-200 group-hover:scale-105 group-hover:bg-white/5">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition group-hover:border-emerald-500/25 group-hover:bg-white/[0.07]">
                      <Icon />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
                    <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-emerald-400/90 transition group-hover:text-emerald-300">
                      {cta}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-white/10 bg-[#121212]/90 px-5 py-6 sm:px-8">
          <WaitlistEmailCapture source="homepage_invest_strip" />
        </div>
      </div>
    </section>
  );
}
