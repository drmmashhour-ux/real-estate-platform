"use client";

import { useState } from "react";

type Result = {
  suggestedPrice: number;
  suggestedMin: number;
  suggestedMax: number;
  confidenceScore: number;
  confidenceLabel: "low" | "medium" | "high";
  marketPosition: "below_range" | "within_range" | "above_range";
  priceGapPercent: number;
  summary: string;
  recommendation: string;
  negotiationAngle: string;
  signals: string[];
  warnings: string[];
  dataConfidenceNote: string;
};

function money(value: number) {
  return `$${Math.round(value).toLocaleString("en-CA")}`;
}

function toneClass(position: Result["marketPosition"]) {
  if (position === "below_range") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  if (position === "above_range") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return "border-sky-500/30 bg-sky-500/10 text-sky-100";
}

export function MarketPricingAssistant() {
  const [mode, setMode] = useState<"buyer" | "seller">("buyer");
  const [city, setCity] = useState("Montreal");
  const [propertyType, setPropertyType] = useState("Condo");
  const [askingPrice, setAskingPrice] = useState("550000");
  const [surfaceSqft, setSurfaceSqft] = useState("950");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [condition, setCondition] = useState("Good");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/market/pricing-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          city,
          propertyType,
          askingPrice: Number(askingPrice),
          surfaceSqft: Number(surfaceSqft),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          condition,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.result) {
        setError(typeof data?.error === "string" ? data.error : "Unable to generate pricing guidance.");
        setResult(null);
        return;
      }

      setResult(data.result as Result);
    } catch {
      setError("Network error. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6" aria-labelledby="market-pricing-assistant">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="market-pricing-assistant" className="text-xl font-semibold text-white">
            AI market pricing assistant
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Helps buyers and sellers judge whether a price is low, fair, or high versus the platform's market band.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("buyer")}
            className={`rounded-full px-4 py-2 ${mode === "buyer" ? "bg-premium-gold text-black" : "text-slate-300"}`}
          >
            Buyer
          </button>
          <button
            type="button"
            onClick={() => setMode("seller")}
            className={`rounded-full px-4 py-2 ${mode === "seller" ? "bg-premium-gold text-black" : "text-slate-300"}`}
          >
            Seller
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">City</span>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white">
            <option>Montreal</option>
            <option>Laval</option>
            <option>Quebec</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Property type</span>
          <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white">
            <option>Condo</option>
            <option>House</option>
            <option>Townhouse</option>
            <option>Duplex / Triplex</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">{mode === "buyer" ? "Asking price (CAD)" : "Target listing price (CAD)"}</span>
          <input value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} type="number" min={0} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Surface area (sqft)</span>
          <input value={surfaceSqft} onChange={(e) => setSurfaceSqft(e.target.value)} type="number" min={250} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Bedrooms</span>
          <input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} type="number" min={0} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Bathrooms</span>
          <input value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} type="number" min={0} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white" />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="text-slate-400">Condition</span>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white">
            <option>Excellent</option>
            <option>Good</option>
            <option>Fair</option>
            <option>Needs work</option>
          </select>
        </label>
        <div className="md:col-span-2">
          <button type="submit" disabled={loading} className="rounded-full bg-premium-gold px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-60">
            {loading ? "Generating guidance..." : "Get AI pricing suggestion"}
          </button>
        </div>
      </form>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      {result ? (
        <div className="mt-6 space-y-5">
          <div className={`rounded-2xl border p-4 ${toneClass(result.marketPosition)}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Market position</p>
            <p className="mt-2 text-lg font-semibold">{result.summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Suggested price</p>
              <p className="mt-2 text-xl font-semibold text-premium-gold">{money(result.suggestedPrice)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Suggested range</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {money(result.suggestedMin)} - {money(result.suggestedMax)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Confidence</p>
              <p className="mt-2 text-xl font-semibold capitalize text-white">
                {result.confidenceLabel} ({result.confidenceScore}/100)
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Gap vs midpoint</p>
              <p className="mt-2 text-xl font-semibold text-white">{result.priceGapPercent}%</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-base font-semibold text-white">Recommendation</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{result.recommendation}</p>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">{result.negotiationAngle}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="text-base font-semibold text-white">Confidence note</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{result.dataConfidenceNote}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-base font-semibold text-white">Signals used</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {result.signals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
