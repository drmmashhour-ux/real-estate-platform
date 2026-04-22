"use client";

import Link from "next/link";

const stats = [
  { label: "Revenue today", value: "$12.8K" },
  { label: "Bookings", value: "48" },
  { label: "Leads", value: "63" },
  { label: "Alerts", value: "4" },
];

const insights = ["BNHub revenue ↑ 11% vs 7-day avg", "Seller engagement strongest in premium Montréal"];

const hubs = ["buyer", "seller", "broker", "investor", "bnhub", "rent"] as const;

type Props = {
  adminBase: string;
};

export function AdminMobileHome({ adminBase }: Props) {
  return (
    <div className="mx-auto max-w-lg px-4 pb-10 pt-6">
      <p className="text-center text-xs uppercase tracking-[0.35em] text-[#D4AF37]/85">LECIPM</p>
      <h1 className="mt-3 text-center text-xl font-semibold text-white">Admin · Mobile</h1>
      <p className="mt-2 text-center text-sm text-white/45">Swipe-friendly command surface — desktop uses full command center.</p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-[#0D0D0D] px-4 py-4">
            <p className="text-[11px] uppercase tracking-wide text-white/40">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">AI insights</h2>
        <ul className="mt-3 space-y-2">
          {insights.map((line) => (
            <li key={line} className="rounded-xl border border-white/8 bg-[#111] px-4 py-3 text-sm text-white/70">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">Hubs</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {hubs.map((slug) => (
            <Link
              key={slug}
              href={`${adminBase}/hubs/${slug}`}
              className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-medium capitalize text-[#D4AF37]"
            >
              {slug === "bnhub" ? "BNHub" : slug}
            </Link>
          ))}
        </div>
      </section>

      <Link
        href={adminBase}
        className="mt-10 block text-center text-sm text-white/45 hover:text-[#D4AF37]"
      >
        Full desktop command center →
      </Link>
    </div>
  );
}
