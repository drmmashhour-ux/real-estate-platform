"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { computeRoi } from "@/lib/invest/roi";
import { analyzeDeal } from "@/lib/ai/deal-analyzer";
import { computeDecisionScores, type CompareMode } from "@/lib/compare/score";
import { useCompare } from "@/components/compare/CompareProvider";
import { MAX_COMPARE } from "@/lib/compare/constants";

type SnapshotListing = {
  id: string;
  title: string;
  address: string;
  city: string;
  priceCents: number;
  bedrooms: number | null;
  bathrooms: number | null;
  surfaceSqft: number | null;
  propertyType: string;
  yearBuilt: number | null;
  parking: string | null;
  annualTaxesCents: number | null;
  condoFeesAnnualCents: number | null;
  imageUrl: string | null;
  href: string;
  welcomeTaxCents: number;
};

export function ComparePageClient() {
  const { ids, remove, clear, hydrated } = useCompare();
  const [listings, setListings] = useState<SnapshotListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<CompareMode>("investor");
  const [inputs, setInputs] = useState<
    Record<string, { rent: number; downPct: number; rate: number; amort: number }>
  >({});

  useEffect(() => {
    void fetch("/api/compare/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "view", listingIds: ids, mode }),
    }).catch(() => {});
  }, [ids, mode]);

  const load = useCallback(async () => {
    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/compare/snapshot?ids=${encodeURIComponent(ids.join(","))}`, {
        credentials: "same-origin",
      });
      const j = await res.json();
      const rows = Array.isArray(j?.listings) ? (j.listings as SnapshotListing[]) : [];
      setListings(rows);
      setInputs((prev) => {
        const next = { ...prev };
        for (const l of rows) {
          if (!next[l.id]) {
            const price = l.priceCents / 100;
            const rent = Math.round(price * 0.004);
            next[l.id] = {
              rent: Math.max(100, rent),
              downPct: 20,
              rate: 5.49,
              amort: 25,
            };
          }
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    const out: Record<
      string,
      {
        payment: number;
        cashFlow: number;
        cap: number;
        roi: number;
        annualCf: number;
        featureScore: number;
      }
    > = {};
    for (const l of listings) {
      const inp = inputs[l.id];
      if (!inp) continue;
      const price = l.priceCents / 100;
      const down = (price * inp.downPct) / 100;
      const roi = computeRoi({
        purchasePrice: price,
        downPayment: down,
        mortgageInterestRate: inp.rate,
        amortizationYears: inp.amort,
        monthlyRent: inp.rent,
        vacancyRatePercent: 5,
        propertyTaxAnnual: l.annualTaxesCents != null ? l.annualTaxesCents / 100 : price * 0.012,
        condoFeesAnnual: l.condoFeesAnnualCents != null ? l.condoFeesAnnualCents / 100 : 0,
        insuranceAnnual: 1200,
        managementAnnual: 0,
        repairsReserveAnnual: price * 0.01,
        closingCosts: 7500,
        welcomeTax: l.welcomeTaxCents / 100,
        otherMonthlyExpenses: 0,
        otherAnnualExpenses: 0,
      });
      const beds = l.bedrooms ?? 0;
      const baths = l.bathrooms ?? 0;
      const sq = l.surfaceSqft ?? 0;
      out[l.id] = {
        payment: roi.monthlyMortgagePayment,
        cashFlow: roi.monthlyCashFlow,
        cap: roi.capRatePercent,
        roi: roi.roiPercent,
        annualCf: roi.annualCashFlow,
        featureScore: beds + baths * 0.5 + sq / 800,
      };
    }
    return out;
  }, [listings, inputs]);

  const dealAnalyses = useMemo(() => {
    const out: Record<string, ReturnType<typeof analyzeDeal>> = {};
    for (const l of listings) {
      const inp = inputs[l.id];
      if (!inp) continue;
      const price = l.priceCents / 100;
      const down = (price * inp.downPct) / 100;
      const beds = l.bedrooms ?? 0;
      const baths = l.bathrooms ?? 0;
      const sq = l.surfaceSqft ?? 0;
      const buyerFeatureScore = Math.min(1, Math.max(0, (beds + baths * 0.5 + sq / 800) / 8));
      out[l.id] = analyzeDeal({
        purchasePrice: price,
        rentEstimate: inp.rent,
        propertyTaxAnnual: l.annualTaxesCents != null ? l.annualTaxesCents / 100 : price * 0.012,
        condoFeesAnnual: l.condoFeesAnnualCents != null ? l.condoFeesAnnualCents / 100 : 0,
        insuranceAnnual: 1200,
        managementAnnual: 0,
        repairsReserveAnnual: price * 0.01,
        closingCosts: 7500,
        welcomeTax: l.welcomeTaxCents / 100,
        otherMonthlyExpenses: 0,
        otherAnnualExpenses: 0,
        interestRate: inp.rate,
        downPayment: down,
        amortizationYears: inp.amort,
        vacancyRatePercent: 5,
        locationCity: l.city,
        propertyType: l.propertyType,
        mode: mode === "investor" ? "investor" : "buyer",
        buyerFeatureScore,
      });
    }
    return out;
  }, [listings, inputs, mode]);

  const bestDealScoreId = useMemo(() => {
    if (!listings.length) return null;
    let best: string | null = null;
    let bestScore = -1;
    for (const l of listings) {
      const s = dealAnalyses[l.id]?.dealScore;
      if (s == null) continue;
      if (s > bestScore) {
        bestScore = s;
        best = l.id;
      }
    }
    return best;
  }, [listings, dealAnalyses]);

  const { bestId, scores } = useMemo(() => {
    const rows = listings.map((l) => {
      const m = metrics[l.id];
      return {
        id: l.id,
        roiPercent: m?.roi ?? 0,
        annualCashFlow: m?.annualCf ?? 0,
        price: l.priceCents / 100,
        capRatePercent: m?.cap ?? 0,
        featureScore: m?.featureScore ?? 0,
      };
    });
    return computeDecisionScores(mode, rows);
  }, [listings, metrics, mode]);

  const lowestPriceId = useMemo(() => {
    if (!listings.length) return null;
    return listings.reduce((a, b) => (a.priceCents <= b.priceCents ? a : b)).id;
  }, [listings]);

  const bestCashId = useMemo(() => {
    if (!listings.length) return null;
    return listings.reduce((a, b) => {
      const ma = metrics[a.id]?.annualCf ?? -1e9;
      const mb = metrics[b.id]?.annualCf ?? -1e9;
      return ma >= mb ? a : b;
    }).id;
  }, [listings, metrics]);

  const bestRoiId = useMemo(() => {
    if (!listings.length) return null;
    return listings.reduce((a, b) => {
      const ma = metrics[a.id]?.roi ?? -1e9;
      const mb = metrics[b.id]?.roi ?? -1e9;
      return ma >= mb ? a : b;
    }).id;
  }, [listings, metrics]);

  function patchInput(id: string, patch: Partial<{ rent: number; downPct: number; rate: number; amort: number }>) {
    setInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id]!, ...patch },
    }));
  }

  async function copyShare() {
    const url = `${window.location.origin}/compare?fsbo=${encodeURIComponent(ids.join(","))}`;
    await navigator.clipboard.writeText(url);
    window.alert("Link copied to clipboard.");
  }

  async function downloadPdf() {
    const cols = listings.map((l) => l.title.slice(0, 24));
    const rows: { label: string; values: string[] }[] = [
      {
        label: "Price",
        values: listings.map((l) => `$${(l.priceCents / 100).toLocaleString()}`),
      },
      {
        label: "Monthly payment (est.)",
        values: listings.map((l) => `$${(metrics[l.id]?.payment ?? 0).toFixed(0)}`),
      },
      {
        label: "Monthly cash flow",
        values: listings.map((l) => `$${(metrics[l.id]?.cashFlow ?? 0).toFixed(0)}`),
      },
      {
        label: "Cap rate %",
        values: listings.map((l) => `${(metrics[l.id]?.cap ?? 0).toFixed(2)}%`),
      },
      {
        label: "ROI % (Y1)",
        values: listings.map((l) => `${(metrics[l.id]?.roi ?? 0).toFixed(2)}%`),
      },
      {
        label: "AI deal score (est.)",
        values: listings.map((l) => String(dealAnalyses[l.id]?.dealScore ?? "—")),
      },
      {
        label: "Decision score",
        values: listings.map((l) => String(scores[l.id] ?? "")),
      },
    ];
    const res = await fetch("/api/compare/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Property comparison",
        columns: cols,
        rows,
        recommendation:
          bestId && scores[bestId] != null
            ? `Illustrative pick by ${mode} mode (rule-based score ${scores[bestId]}). Verify with a professional.`
            : "",
      }),
    });
    const blob = await res.blob();
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = "lecipm-property-comparison.pdf";
    a.click();
    URL.revokeObjectURL(u);
  }

  if (!hydrated) {
    return <div className="py-20 text-center text-slate-500">Loading…</div>;
  }

  if (ids.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-2xl font-semibold text-white">Nothing to compare yet</h1>
        <p className="mt-3 text-slate-400">
          Browse FSBO listings and tap <strong className="text-[#C9A646]">Compare</strong> on up to {MAX_COMPARE}{" "}
          properties.
        </p>
        <Link href="/sell#browse-listings" className="mt-6 inline-block rounded-xl bg-[#C9A646] px-6 py-3 text-sm font-bold text-black">
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#C9A646]">Property comparison</p>
          <h1 className="text-2xl font-bold text-white">Side-by-side</h1>
          <p className="mt-1 text-sm text-slate-500">
            Estimates only — not investment or mortgage advice. Adjust rent, down %, and rate per property.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("investor")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === "investor" ? "bg-[#C9A646] text-black" : "border border-white/20 text-white"}`}
          >
            Investor
          </button>
          <button
            type="button"
            onClick={() => setMode("buyer")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === "buyer" ? "bg-[#C9A646] text-black" : "border border-white/20 text-white"}`}
          >
            Buyer
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyShare()}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
        >
          Copy share link
        </button>
        <button
          type="button"
          onClick={() => void downloadPdf()}
          className="rounded-lg border border-[#C9A646]/50 px-4 py-2 text-sm text-[#C9A646]"
        >
          Download PDF
        </button>
        <button type="button" onClick={() => clear()} className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300">
          Clear all
        </button>
      </div>

      {bestId && scores[bestId] != null ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
          <strong>Best option ({mode} mode, illustrative):</strong>{" "}
          {listings.find((l) => l.id === bestId)?.title ?? bestId}{" "}
          <span className="text-emerald-300">(decision score {scores[bestId]})</span>
          {bestDealScoreId && dealAnalyses[bestDealScoreId] ? (
            <span className="block mt-1 text-emerald-200/90">
              Highest AI deal score (estimate):{" "}
              <strong>{listings.find((l) => l.id === bestDealScoreId)?.title ?? bestDealScoreId}</strong>{" "}
              ({dealAnalyses[bestDealScoreId].dealScore}/100)
            </span>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="text-slate-500">Loading listings…</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="sticky left-0 z-10 bg-[#0B0B0B] px-3 py-3 text-slate-400">Attribute</th>
                  {listings.map((l) => (
                    <th key={l.id} className="min-w-[160px] px-3 py-3 align-top">
                      <div className="space-y-2">
                        {l.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.imageUrl} alt="" className="h-24 w-full rounded-lg object-cover" />
                        ) : null}
                        <Link href={l.href} className="font-semibold text-[#C9A646] hover:underline">
                          {l.title}
                        </Link>
                        <button
                          type="button"
                          className="text-xs text-red-400 hover:underline"
                          onClick={() => remove(l.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <MetricRow label="Price" listings={listings} badges={lowestPriceId} colBadge="Lowest price" />
                {(
                  [
                    { label: "Address", fn: (x: SnapshotListing) => x.address },
                    { label: "City", fn: (x: SnapshotListing) => x.city },
                    { label: "Type", fn: (x: SnapshotListing) => x.propertyType },
                    { label: "Beds", fn: (x: SnapshotListing) => String(x.bedrooms ?? "—") },
                    { label: "Baths", fn: (x: SnapshotListing) => String(x.bathrooms ?? "—") },
                    { label: "Surface (sq ft)", fn: (x: SnapshotListing) => String(x.surfaceSqft ?? "—") },
                    { label: "Year built", fn: (x: SnapshotListing) => String(x.yearBuilt ?? "—") },
                    { label: "Parking", fn: (x: SnapshotListing) => x.parking ?? "—" },
                    {
                      label: "Taxes (annual)",
                      fn: (x: SnapshotListing) =>
                        x.annualTaxesCents != null ? `$${(x.annualTaxesCents / 100).toLocaleString()}` : "—",
                    },
                    {
                      label: "Condo fees (annual)",
                      fn: (x: SnapshotListing) =>
                        x.condoFeesAnnualCents != null ? `$${(x.condoFeesAnnualCents / 100).toLocaleString()}` : "—",
                    },
                    { label: "Welcome tax (est.)", fn: (x: SnapshotListing) => `$${(x.welcomeTaxCents / 100).toFixed(0)}` },
                  ] as const
                ).map((row) => (
                  <tr key={row.label} className="border-b border-white/5">
                    <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2 text-slate-500">{row.label}</td>
                    {listings.map((l) => (
                      <td key={l.id} className="px-3 py-2">
                        {row.fn(l)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2 text-[#C9A646]">Rent (mo)</td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-3 py-2">
                      <input
                        type="number"
                        className="w-full rounded border border-white/10 bg-black/50 px-2 py-1 text-white"
                        value={inputs[l.id]?.rent ?? ""}
                        onChange={(e) => patchInput(l.id, { rent: Number(e.target.value) })}
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2">Down %</td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-3 py-2">
                      <input
                        type="number"
                        className="w-full rounded border border-white/10 bg-black/50 px-2 py-1"
                        value={inputs[l.id]?.downPct ?? ""}
                        onChange={(e) => patchInput(l.id, { downPct: Number(e.target.value) })}
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2">Rate %</td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        className="w-full rounded border border-white/10 bg-black/50 px-2 py-1"
                        value={inputs[l.id]?.rate ?? ""}
                        onChange={(e) => patchInput(l.id, { rate: Number(e.target.value) })}
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2">Amortization</td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-3 py-2">
                      <input
                        type="number"
                        className="w-full rounded border border-white/10 bg-black/50 px-2 py-1"
                        value={inputs[l.id]?.amort ?? ""}
                        onChange={(e) => patchInput(l.id, { amort: Number(e.target.value) })}
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2">Monthly payment</td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-3 py-2">
                      ${(metrics[l.id]?.payment ?? 0).toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2">
                    Monthly cash flow
                    {bestCashId ? <Badge show={true} text="Best cash flow" /> : null}
                  </td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-3 py-2">
                      <span className={bestCashId === l.id ? "text-emerald-400 font-semibold" : ""}>
                        ${(metrics[l.id]?.cashFlow ?? 0).toFixed(0)}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2">Cap rate %</td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-3 py-2">
                      {(metrics[l.id]?.cap ?? 0).toFixed(2)}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2">
                    ROI % (Y1)
                    {bestRoiId ? <Badge show={true} text="Best ROI" /> : null}
                  </td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-3 py-2">
                      <span className={bestRoiId === l.id ? "text-emerald-400 font-semibold" : ""}>
                        {(metrics[l.id]?.roi ?? 0).toFixed(2)}%
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2">
                    AI deal score (est.)
                    {bestDealScoreId ? <Badge show={true} text="Best deal score" /> : null}
                  </td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-3 py-2">
                      <span className={bestDealScoreId === l.id ? "text-emerald-400 font-semibold" : ""}>
                        {dealAnalyses[l.id]?.dealScore ?? "—"}/100
                      </span>
                      <span className="ml-1 block text-[10px] text-slate-500">
                        {dealAnalyses[l.id]?.classificationLabel ?? ""}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2">Decision score</td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-3 py-2">
                      {scores[l.id] ?? "—"}{" "}
                      {bestId === l.id ? <span className="ml-1 text-xs text-emerald-400">★ Best fit</span> : null}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-6 md:hidden">
            {listings.map((l) => (
              <div key={l.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <Link href={l.href} className="text-lg font-semibold text-[#C9A646]">
                  {l.title}
                </Link>
                <p className="text-sm text-slate-400">{l.address}</p>
                <p className="mt-2 text-xl font-bold text-white">${(l.priceCents / 100).toLocaleString()}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">Cash flow / mo</span>
                    <p className="font-medium text-white">${(metrics[l.id]?.cashFlow ?? 0).toFixed(0)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ROI %</span>
                    <p className="font-medium text-white">{(metrics[l.id]?.roi ?? 0).toFixed(2)}%</p>
                  </div>
                  <div>
                    <span className="text-slate-500">AI deal score (est.)</span>
                    <p className="font-medium text-[#C9A646]">
                      {dealAnalyses[l.id]?.dealScore ?? "—"}/100
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Classification</span>
                    <p className="font-medium text-white">{dealAnalyses[l.id]?.classificationLabel ?? "—"}</p>
                  </div>
                </div>
                <button type="button" className="mt-3 text-xs text-red-400" onClick={() => remove(l.id)}>
                  Remove from compare
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <BrokerLeadForm listingIds={ids} mode={mode} />
    </div>
  );
}

function Badge({ show, text }: { show: boolean; text: string }) {
  if (!show) return null;
  return (
    <span className="ml-2 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-300">
      {text}
    </span>
  );
}

function MetricRow({
  label,
  listings,
  badges,
  colBadge,
}: {
  label: string;
  listings: SnapshotListing[];
  badges: string | null;
  colBadge: string;
}) {
  return (
    <tr className="border-b border-white/5">
      <td className="sticky left-0 bg-[#0B0B0B] px-3 py-2 text-slate-500">{label}</td>
      {listings.map((l) => (
        <td key={l.id} className="px-3 py-2">
          ${(l.priceCents / 100).toLocaleString()}
          {badges === l.id ? <Badge show text={colBadge} /> : null}
        </td>
      ))}
    </tr>
  );
}

function BrokerLeadForm({ listingIds, mode }: { listingIds: string[]; mode: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/compare/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, phone, listingIds, mode }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(j.error || "Failed");
    else setMsg("Thanks — a broker can follow up about these listings.");
  }

  return (
    <div className="rounded-2xl border border-[#C9A646]/25 bg-black/40 p-6">
      <h2 className="text-lg font-semibold text-white">Talk to a broker about these properties</h2>
      <p className="mt-1 text-sm text-slate-500">We&apos;ll attach the selected listing IDs to your request.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          required
          className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          placeholder="Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white sm:col-span-2"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button type="submit" className="rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-bold text-black sm:col-span-2">
          Request callback
        </button>
      </form>
      {msg ? <p className="mt-2 text-sm text-emerald-400">{msg}</p> : null}
    </div>
  );
}
