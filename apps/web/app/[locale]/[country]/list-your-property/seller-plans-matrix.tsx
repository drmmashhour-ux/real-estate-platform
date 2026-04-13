"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PropertySegmentTab } from "./list-your-property-types";
import {
  buildPlanCheckoutHref,
  planPriceDisplay,
  sellerPlans,
  type BillingPeriod,
} from "@/lib/pricing/public-catalog";

const SEGMENTS: { id: PropertySegmentTab; label: string }[] = [
  { id: "residential", label: "Residential" },
  { id: "multiplex", label: "Multiplex" },
  { id: "commercial", label: "Commercial" },
  { id: "land", label: "Lot / land" },
];

type PlanId = "free" | "standard" | "pro" | "premium";

type Row = { label: string; hint?: string; cells: Record<PlanId, string> };

const MATRIX_ROWS: Row[] = [
  {
    label: "AI intake & F-reference listing code",
    cells: {
      free: "Included",
      standard: "Included",
      pro: "Included",
      premium: "Included",
    },
  },
  {
    label: "AI document & photo classification",
    cells: {
      free: "Core",
      standard: "Core + optimization tips",
      pro: "Advanced",
      premium: "Advanced + priority scoring",
    },
  },
  {
    label: "Search & hub exposure",
    cells: {
      free: "Basic placement",
      standard: "Improved placement",
      pro: "Premium placement",
      premium: "Featured + max reach",
    },
  },
  {
    label: "AI pricing & market signals",
    cells: {
      free: "—",
      standard: "Essential signals",
      pro: "Full advisor-style signals",
      premium: "Full + scenario notes",
    },
  },
  {
    label: "Performance analytics",
    cells: {
      free: "—",
      standard: "—",
      pro: "Included",
      premium: "Included",
    },
  },
  {
    label: "Broker / mortgage desk routing",
    cells: {
      free: "Leads Hub capture",
      standard: "Leads Hub + routing tags",
      pro: "Priority in Hub",
      premium: "Collaboration-ready + broker tooling",
    },
  },
];

function CheckOrText({ v }: { v: string }) {
  if (v === "—") return <span className="text-slate-600">—</span>;
  return <span className="text-slate-200">{v}</span>;
}

type SellerPlansMatrixProps = {
  segment: PropertySegmentTab;
  onSegmentChange: (s: PropertySegmentTab) => void;
};

export function SellerPlansMatrix({ segment, onSegmentChange }: SellerPlansMatrixProps) {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  const planById = useMemo(() => Object.fromEntries(sellerPlans.map((p) => [p.id, p])) as Record<
    PlanId,
    (typeof sellerPlans)[0]
  >, []);

  const cols: PlanId[] = ["free", "standard", "pro", "premium"];

  return (
    <section id="plans" className="mt-20 scroll-mt-24" aria-labelledby="choose-plan-heading">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-premium-gold/85">Choose your path</p>
        <h2 id="choose-plan-heading" className="mt-3 font-serif text-2xl font-semibold text-white sm:text-3xl">
          Plans built for self-serve sellers — upgrade when you need reach
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
          Same subscription tiers across property types; segment selection helps us route Leads Hub and broker desks.
          AI handles intake and checks — humans engage only when you buy collaboration or external professionals.
        </p>
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5"
          role="tablist"
          aria-label="Property type"
        >
          {SEGMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={segment === s.id}
              onClick={() => onSegmentChange(s.id)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                segment === s.id
                  ? "bg-slate-700 text-white shadow-inner"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              billing === "monthly" ? "bg-premium-gold/20 text-premium-gold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              billing === "yearly" ? "bg-premium-gold/20 text-premium-gold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Yearly (save ~15%)
          </button>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-slate-500">
        Viewing: <span className="text-slate-400">{SEGMENTS.find((s) => s.id === segment)?.label}</span> — used for Leads
        Hub segmentation only; checkout uses the same four tiers.
      </p>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="sticky left-0 z-10 bg-black/90 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Feature
              </th>
              {cols.map((id) => {
                const plan = planById[id];
                const { main, sub } = planPriceDisplay(plan, billing);
                const href =
                  id === "free"
                    ? "#start-intake"
                    : buildPlanCheckoutHref("seller", id, billing);
                const highlighted = plan.highlighted;
                return (
                  <th
                    key={id}
                    className={`min-w-[140px] px-3 py-4 align-bottom ${
                      highlighted ? "bg-premium-gold/[0.07] ring-1 ring-premium-gold/25" : ""
                    }`}
                  >
                    {plan.badge === "most-popular" ? (
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-premium-gold">Most popular</p>
                    ) : (
                      <span className="mb-1 block h-4" />
                    )}
                    <p className="font-serif text-lg font-semibold text-white">{plan.name}</p>
                    <p className="mt-1 text-2xl font-bold text-premium-gold">{main}</p>
                    {sub ? <p className="text-[10px] text-slate-500">{sub}</p> : null}
                    <Link
                      href={href}
                      className={`mt-4 inline-flex w-full min-h-[40px] items-center justify-center rounded-xl text-xs font-semibold transition ${
                        id === "free"
                          ? "border border-white/25 text-white hover:border-premium-gold/50"
                          : highlighted
                            ? "bg-gradient-to-r from-premium-gold via-[#d4b45c] to-[#a88a2e] text-black hover:brightness-110"
                            : "border border-white/20 text-slate-200 hover:border-premium-gold/40"
                      }`}
                    >
                      {id === "free" ? "Start free" : "Choose plan"}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="sticky left-0 bg-black/80 px-4 py-3 text-slate-300">{row.label}</td>
                {cols.map((id) => (
                  <td key={id} className={`px-3 py-3 text-xs sm:text-sm ${planById[id].highlighted ? "bg-premium-gold/[0.04]" : ""}`}>
                    <CheckOrText v={row.cells[id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Prefer a side-by-side grid?{" "}
        <Link href="/pricing/seller" className="text-premium-gold hover:underline">
          Open full seller pricing
        </Link>
        .
      </p>
    </section>
  );
}
