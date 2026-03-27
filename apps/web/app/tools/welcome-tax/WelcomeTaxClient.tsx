"use client";

import { useEffect, useMemo, useState } from "react";
import {
  estimateWelcomeTaxFromConfig,
  parseWelcomeTaxConfigFromDb,
  type WelcomeTaxResult,
} from "@/lib/tax/welcome-tax";
import { ToolLeadForm } from "@/components/tools/ToolLeadForm";
import { LegalDisclaimerBlock } from "@/components/tools/ToolShell";

type Muni = { slug: string; name: string };

export function WelcomeTaxClient() {
  const [munis, setMunis] = useState<Muni[]>([]);
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState(500_000);
  const [buyerType, setBuyerType] = useState("first_time");
  const [result, setResult] = useState<WelcomeTaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/tool-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolKey: "welcome_tax", eventType: "view" }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    void fetch("/api/welcome-tax/municipalities")
      .then((r) => r.json())
      .then((j) => {
        const list = Array.isArray(j?.municipalities) ? j.municipalities : [];
        setMunis(list);
        if (list[0]?.slug) setSlug(list[0].slug);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setWarn(null);
    void fetch(`/api/welcome-tax/config/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Config not found");
        return r.json();
      })
      .then((j) => {
        const cfg = j?.config;
        if (!cfg) throw new Error("Missing config");
        const parsed = parseWelcomeTaxConfigFromDb(cfg.bracketsJson, cfg.rebateRulesJson);
        const priceCents = Math.round(price * 100);
        const est = estimateWelcomeTaxFromConfig(priceCents, buyerType, parsed);
        setResult(est);
      })
      .catch(() => {
        setResult(null);
        setWarn("No active configuration for this municipality. Admin must add brackets under /admin (welcome tax).");
      })
      .finally(() => setLoading(false));
  }, [slug, price, buyerType]);

  const toolInputs = useMemo(
    () => ({ purchasePrice: price, slug, buyerType }),
    [price, slug, buyerType]
  );

  const toolOutputs = useMemo(
    () =>
      result
        ? {
            totalCents: result.totalCents,
            beforeRebateCents: result.beforeRebateCents,
            rebateCents: result.rebateCents,
          }
        : {},
    [result]
  );

  async function trackCta(kind: string) {
    await fetch("/api/tool-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolKey: "welcome_tax", eventType: kind, city: slug }),
    }).catch(() => {});
  }

  async function downloadPdf() {
    if (!result) return;
    const rows = [
      { label: "Purchase price", value: `$${price.toLocaleString()}` },
      { label: "Municipality", value: slug },
      { label: "Buyer type", value: buyerType },
      { label: "Estimated welcome tax", value: `$${(result.totalCents / 100).toFixed(2)}` },
      ...result.breakdown.map((b, i) => ({
        label: `Bracket ${i + 1}`,
        value: `${b.label} → $${(b.taxCents / 100).toFixed(2)}`,
      })),
    ];
    const res = await fetch("/api/tools/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Welcome tax — estimate",
        rows,
        disclaimer:
          "Estimate only. Municipal rules and exemptions may vary. Not legal or tax advice. Estimate / Internal summary only.",
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lecipm-welcome-tax-estimate.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Inputs</h2>
        <label className="block text-sm text-slate-400">
          Municipality
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
        <label className="block text-sm text-slate-400">
          Purchase price ($)
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm text-slate-400">
          Buyer type (for optional rebate rules in config)
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
            value={buyerType}
            onChange={(e) => setBuyerType(e.target.value)}
          >
            <option value="first_time">First-time / first-time buyer</option>
            <option value="investor">Investor</option>
            <option value="default">Default</option>
          </select>
        </label>
        <p className="text-xs text-amber-200/80">
          Estimate only. Municipal rules and exemptions may vary. Rates come from admin-configured brackets — verify with a
          notary or tax professional.
        </p>
        {warn ? <p className="text-sm text-amber-400">{warn}</p> : null}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-[#C9A646]/35 bg-gradient-to-br from-black/80 to-[#1a1508] p-6">
          <h2 className="text-lg font-semibold text-[#C9A646]">Estimated welcome tax</h2>
          {loading ? <p className="mt-4 text-slate-400">…</p> : null}
          {result && !loading ? (
            <>
              <p className="mt-4 text-4xl font-bold text-white">${(result.totalCents / 100).toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-500">
                Before rebates: ${(result.beforeRebateCents / 100).toFixed(2)} · Rebate applied: $
                {(result.rebateCents / 100).toFixed(2)}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {result.breakdown.map((b, i) => (
                  <li key={i} className="flex justify-between gap-4 border-b border-white/5 pb-2">
                    <span>{b.label}</span>
                    <span>${(b.taxCents / 100).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!result}
          onClick={() => void downloadPdf()}
          className="rounded-lg border border-[#C9A646]/50 px-4 py-2 text-sm text-[#C9A646] disabled:opacity-40"
        >
          Download PDF
        </button>
        <ToolLeadForm leadType="welcome_tax_lead" toolInputs={toolInputs} toolOutputs={toolOutputs} />
        <div className="rounded-xl border border-white/10 p-4">
          <p className="text-sm font-medium text-white">Next steps</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/contact"
              onClick={() => void trackCta("cta_callback")}
              className="rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-semibold text-black"
            >
              Talk to an expert
            </a>
            <a
              href="/mortgage"
              onClick={() => void trackCta("cta_mortgage")}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
            >
              Mortgage specialist
            </a>
          </div>
        </div>
        <LegalDisclaimerBlock />
      </div>
    </div>
  );
}
