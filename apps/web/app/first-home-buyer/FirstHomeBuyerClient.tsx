"use client";

import { useEffect, useMemo, useState } from "react";
import {
  computeAffordability,
  estimateMinimumDownPercent,
} from "@/lib/first-home-buyer/affordability";
import { monthlyMortgagePayment } from "@/lib/invest/roi";
import {
  estimateWelcomeTaxFromConfig,
  parseWelcomeTaxConfigFromDb,
} from "@/lib/tax/welcome-tax";
import { ToolLeadForm } from "@/components/tools/ToolLeadForm";
import { LegalDisclaimerBlock } from "@/components/tools/ToolShell";

type Muni = { slug: string; name: string };
type Incentive = { id: string; title: string; description: string; jurisdiction: string; externalLink: string | null; notes: string | null };

export function FirstHomeBuyerClient() {
  const [income, setIncome] = useState(95_000);
  const [debts, setDebts] = useState(400);
  const [down, setDown] = useState(35_000);
  const [price, setPrice] = useState(520_000);
  const [rate, setRate] = useState(5.29);
  const [amort, setAmort] = useState(25);
  const [slug, setSlug] = useState("");
  const [munis, setMunis] = useState<Muni[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [welcomeCents, setWelcomeCents] = useState<number | null>(null);

  useEffect(() => {
    void fetch("/api/tool-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolKey: "first_home_buyer", eventType: "view" }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    void fetch("/api/welcome-tax/municipalities")
      .then((r) => r.json())
      .then((j) => {
        const list = Array.isArray(j?.municipalities) ? j.municipalities : [];
        setMunis(list);
        if (list[0]?.slug) setSlug(list[0].slug);
      });
    void fetch("/api/incentives/public")
      .then((r) => r.json())
      .then((j) => setIncentives(Array.isArray(j?.incentives) ? j.incentives : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    void fetch(`/api/welcome-tax/config/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.config) {
          setWelcomeCents(null);
          return;
        }
        const parsed = parseWelcomeTaxConfigFromDb(j.config.bracketsJson, j.config.rebateRulesJson);
        const est = estimateWelcomeTaxFromConfig(Math.round(price * 100), "first_time", parsed);
        setWelcomeCents(est.totalCents);
      })
      .catch(() => setWelcomeCents(null));
  }, [slug, price]);

  const aff = useMemo(
    () =>
      computeAffordability({
        annualIncome: income,
        monthlyDebtPayments: debts,
        downPayment: down,
        purchasePrice: price,
        interestRatePercent: rate,
        amortizationYears: amort,
        estimatedClosingCosts: price * 0.015 + 1500,
      }),
    [income, debts, down, price, rate, amort]
  );

  const loan = Math.max(0, price - down);
  const payment = monthlyMortgagePayment(loan, rate, amort);
  const minDownPct = estimateMinimumDownPercent(price);
  const minDownDollars = (price * minDownPct) / 100;
  const closing = price * 0.015 + 1500;

  const toolInputs = useMemo(
    () => ({
      income,
      debts,
      down,
      price,
      rate,
      amort,
      city: slug,
    }),
    [income, debts, down, price, rate, amort, slug]
  );

  const toolOutputs = useMemo(
    () => ({
      ...aff,
      monthlyPayment: payment,
      minDownPct,
      minDownDollars,
      closing,
      welcomeTax: welcomeCents != null ? welcomeCents / 100 : null,
    }),
    [aff, payment, minDownPct, minDownDollars, closing, welcomeCents]
  );

  async function trackCta(kind: string) {
    await fetch("/api/tool-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolKey: "first_home_buyer", eventType: kind, city: slug }),
    }).catch(() => {});
  }

  async function downloadPdf() {
    const rows = [
      { label: "Affordability range (illustrative)", value: `$${aff.estimatedAffordabilityRangeLow.toLocaleString()} – $${aff.estimatedAffordabilityRangeHigh.toLocaleString()}` },
      { label: "Monthly payment (estimate)", value: `$${payment.toFixed(2)}` },
      { label: "Minimum down (illustrative %)", value: `${minDownPct.toFixed(2)}% (~$${minDownDollars.toFixed(0)})` },
      { label: "Closing costs (rough)", value: `$${closing.toFixed(0)}` },
      { label: "Welcome tax (from config)", value: welcomeCents != null ? `$${(welcomeCents / 100).toFixed(2)}` : "N/A" },
    ];
    const res = await fetch("/api/tools/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "First-time buyer — affordability snapshot",
        rows,
        disclaimer:
          "Program eligibility and tax incentives should be verified with a qualified professional. Estimate / Internal summary only.",
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lecipm-first-home-buyer-estimate.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Overview</h2>
        <p className="mt-2 text-sm text-slate-400">
          These tools help you explore affordability and costs.{" "}
          <strong className="text-slate-200">Program eligibility and tax incentives should be verified with a qualified professional.</strong>
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 p-6">
          <h3 className="font-semibold text-[#C9A646]">Inputs</h3>
          <div className="grid gap-3 text-sm">
            {(
              [
                ["Annual gross income", income, (v: number) => setIncome(v)],
                ["Monthly debt payments", debts, (v: number) => setDebts(v)],
                ["Down payment saved", down, (v: number) => setDown(v)],
                ["Purchase price", price, (v: number) => setPrice(v)],
                ["Rate %", rate, (v: number) => setRate(v)],
                ["Amortization (years)", amort, (v: number) => setAmort(v)],
              ] as const
            ).map(([label, val, set]) => (
              <label key={String(label)} className="block text-slate-400">
                {label}
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                  value={val}
                  onChange={(e) => set(Number(e.target.value))}
                />
              </label>
            ))}
            <label className="block text-slate-400">
              City / municipality (welcome tax)
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              >
                {munis.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[#C9A646]/30 bg-gradient-to-br from-black/80 to-[#1a1508] p-6">
          <h3 className="font-semibold text-[#C9A646]">Outputs</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Estimated affordability range</dt>
              <dd className="text-white">
                ${aff.estimatedAffordabilityRangeLow.toLocaleString()} – ${aff.estimatedAffordabilityRangeHigh.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Monthly payment (principal &amp; interest)</dt>
              <dd className="text-white">${payment.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Minimum down (illustrative)</dt>
              <dd className="text-white">
                {minDownPct.toFixed(2)}% (~${minDownDollars.toFixed(0)})
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Estimated closing costs (rough)</dt>
              <dd className="text-white">${closing.toFixed(0)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Welcome tax (from config)</dt>
              <dd className="text-white">
                {welcomeCents != null ? `$${(welcomeCents / 100).toFixed(2)}` : "—"}
              </dd>
            </div>
          </dl>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-slate-500">
            {aff.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void downloadPdf()}
            className="mt-4 rounded-lg border border-[#C9A646]/50 px-4 py-2 text-sm text-[#C9A646]"
          >
            Download PDF
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 p-6">
        <h3 className="font-semibold text-white">Incentives &amp; programs (admin notes)</h3>
        <p className="mt-2 text-xs text-slate-500">
          Placeholders below are configurable by admin. They are not guarantees of eligibility.
        </p>
        <div className="mt-4 space-y-3">
          {incentives.length ? (
            incentives.map((i) => (
              <div key={i.id} className="rounded-lg border border-white/5 bg-black/30 p-4 text-sm">
                <p className="font-medium text-[#C9A646]">{i.title}</p>
                <p className="mt-1 text-slate-300">{i.description}</p>
                {i.externalLink ? (
                  <a href={i.externalLink} className="mt-2 inline-block text-xs text-sky-400 underline" target="_blank" rel="noreferrer">
                    External link
                  </a>
                ) : null}
                {i.notes ? <p className="mt-2 text-xs text-slate-500">{i.notes}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No active incentive notes yet — admin can add them under /admin/config/incentives.</p>
          )}
        </div>
      </section>

      <ToolLeadForm leadType="first_home_buyer_lead" toolInputs={toolInputs} toolOutputs={toolOutputs} />

      <div className="rounded-xl border border-white/10 p-4">
        <p className="text-sm font-medium text-white">Expert handoff</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/mortgage"
            onClick={() => void trackCta("cta_mortgage")}
            className="rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-semibold text-black"
          >
            Talk to mortgage expert
          </a>
          <a
            href="/contact"
            onClick={() => void trackCta("cta_callback")}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
          >
            Request callback
          </a>
          <a
            href="/dashboard/broker"
            onClick={() => void trackCta("cta_broker")}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
          >
            Talk to broker
          </a>
        </div>
      </div>

      <LegalDisclaimerBlock />
    </div>
  );
}
