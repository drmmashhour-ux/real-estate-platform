import type { Metadata } from "next";
import Link from "next/link";
import { ToolShell } from "@/components/tools/ToolShell";

export const metadata: Metadata = {
  title: "Investor tools",
};

export default function InvestToolsPage() {
  const cards = [
    {
      href: "/invest/tools/roi",
      title: "ROI calculator",
      desc: "Yield, cap rate, cash flow, cash-on-cash — with disclaimers.",
    },
    {
      href: "/tools/welcome-tax",
      title: "Welcome tax estimator",
      desc: "Configurable municipal brackets (admin-maintained).",
    },
    {
      href: "/tools/municipality-school-tax",
      title: "Municipality & school tax",
      desc: "Annual property tax from assessment & rates per $100.",
    },
    {
      href: "/dashboard/investments/compare",
      title: "Compare scenarios",
      desc: "Side-by-side project comparison in your dashboard.",
    },
    {
      href: "/invest/portfolio",
      title: "AI portfolio planner",
      desc: "Goals, risk, suggested mixes — estimates only; save scenarios when signed in.",
    },
    {
      href: "/dashboard/investor",
      title: "Investor workspace",
      desc: "Saved portfolio scenarios, exports, and expert CTAs.",
    },
  ];

  return (
    <ToolShell title="Investor tools" subtitle="Black & gold calculators — estimates only.">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-premium-gold/30 bg-gradient-to-br from-black/60 to-[#1a1508] p-6 transition hover:border-premium-gold/60"
          >
            <h2 className="text-lg font-semibold text-premium-gold">{c.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{c.desc}</p>
            <p className="mt-4 text-sm text-white">Open →</p>
          </Link>
        ))}
      </div>
    </ToolShell>
  );
}
