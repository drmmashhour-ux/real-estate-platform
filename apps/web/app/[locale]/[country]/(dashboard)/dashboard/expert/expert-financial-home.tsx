"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Overview = {
  verificationStatus: string;
  subscriptionActive: boolean;
  plan: string;
  leadsUsedThisMonth: number;
  monthlyLeadCap: number;
};

function planLabel(p: string): string {
  const x = p.toLowerCase();
  if (x === "basic") return "Gold";
  if (x === "pro") return "Platinum";
  if (x === "premium") return "Platinum+";
  if (x === "ambassador") return "Ambassador";
  return p;
}

export function ExpertFinancialHome() {
  const [data, setData] = useState<Overview | null>(null);

  const load = useCallback(async () => {
    const [prof, bill] = await Promise.all([
      fetch("/api/mortgage/expert/profile", { credentials: "same-origin" }),
      fetch("/api/mortgage/expert/billing", { credentials: "same-origin" }),
    ]);
    if (!prof.ok || !bill.ok) return;
    const p = (await prof.json()) as { expertVerificationStatus?: string };
    const b = (await bill.json()) as {
      plan?: string;
      subscriptionActive?: boolean;
      leadsUsedThisMonth?: number;
      monthlyLeadCap?: number;
    };
    setData({
      verificationStatus: p.expertVerificationStatus ?? "profile_incomplete",
      subscriptionActive: Boolean(b.subscriptionActive),
      plan: b.plan ?? "basic",
      leadsUsedThisMonth: b.leadsUsedThisMonth ?? 0,
      monthlyLeadCap: b.monthlyLeadCap ?? 0,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) {
    return <div className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" aria-hidden />;
  }

  const v = data.verificationStatus;
  const capLabel = data.monthlyLeadCap < 0 ? "∞" : String(data.monthlyLeadCap);

  const tiles: { href: string; title: string; sub: string; accent: string }[] = [
    {
      href: "/dashboard/expert/leads",
      title: "Lead queue",
      sub: "Assigned & marketplace",
      accent: "from-emerald-900/40 to-transparent",
    },
    {
      href: "/dashboard/expert/inbox",
      title: "Immo inbox",
      sub: "Client messages",
      accent: "from-sky-900/40 to-transparent",
    },
    {
      href: "/dashboard/expert/ai-tools",
      title: "AI assistant",
      sub: "Translate & polish (Gemini)",
      accent: "from-violet-900/40 to-transparent",
    },
    {
      href: "/dashboard/expert/billing",
      title: "Billing",
      sub: `${planLabel(data.plan)} · ${data.subscriptionActive ? "Active" : "Set up"}`,
      accent: "from-amber-900/40 to-transparent",
    },
  ];

  return (
    <section
      className="mb-10 overflow-hidden rounded-2xl border border-[#1e3a5f] bg-gradient-to-br from-[#0a1628] via-[#0b0f18] to-[#0a0a0c] p-6 shadow-[0_0_80px_rgba(14,116,184,0.12)] sm:p-8"
      aria-labelledby="fin-desk-title"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-400/85">Mortgage financing desk</p>
          <h2 id="fin-desk-title" className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome back
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            A calm workspace for licensed brokers: leads, compliance-friendly drafting, and subscription in one place.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
              Verification:{" "}
              <strong className="text-white">
                {v === "verified" ? "Verified" : v === "pending_review" ? "In review" : "Action needed"}
              </strong>
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
              Leads this month:{" "}
              <strong className="font-mono text-white">
                {data.leadsUsedThisMonth} / {capLabel}
              </strong>
            </span>
          </div>
          {v !== "verified" ? (
            <Link
              href="/dashboard/expert/verification"
              className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-500"
            >
              Complete verification
            </Link>
          ) : null}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-md lg:max-w-lg">
          {tiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`group rounded-xl border border-white/10 bg-gradient-to-br ${t.accent} p-4 transition hover:border-sky-500/40 hover:bg-white/[0.04]`}
            >
              <p className="text-sm font-semibold text-white group-hover:text-sky-100">{t.title}</p>
              <p className="mt-1 text-xs text-slate-500">{t.sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
