"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCompare } from "@/components/compare/CompareProvider";
import { PORTFOLIO_DISCLAIMER_TEXT } from "@/lib/invest/portfolio-disclaimer";

import type { InvestorProfileInput } from "@/lib/invest/portfolio-types";

type PortfolioScenarioPreview = {
  kind: "conservative" | "balanced" | "aggressive";
  title: string;
  items: EnrichedListingJson[];
  summary: {
    propertyCount: number;
    totalPurchaseCents: number;
    totalDownCents: number;
    avgRoi: number;
    avgCap: number;
    monthlyCashFlow: number;
    annualCashFlow: number;
    riskLevel: string;
  };
  diversification: { score: number; cityBreakdown: Record<string, number>; notes: string[] };
  insights: { strengths: string[]; risks: string[]; opportunities: string[] };
};

type EnrichedListingJson = {
  listing: {
    id: string;
    title: string;
    city: string;
    priceCents: number;
    bedrooms: number | null;
    bathrooms: number | null;
    surfaceSqft: number | null;
    coverImage: string | null;
    images: string[];
  };
  roi: {
    roiPercent: number;
    capRatePercent: number;
    monthlyCashFlow: number;
  };
  deal: { riskLevel: string };
  marketTrend: string;
  fitScore: number;
  strengths: string[];
  risks: string[];
  whyRecommended: string;
  estimatedRentCents: number;
};

type PortfolioBuildResult = {
  label: string;
  recommended: EnrichedListingJson[];
  scenarios: PortfolioScenarioPreview[];
  disclaimer: string;
};

const STEPS = 3;

export function PortfolioPlannerClient() {
  const { add } = useCompare();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [build, setBuild] = useState<PortfolioBuildResult | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [budget, setBudget] = useState("");
  const [down, setDown] = useState("");
  const [cities, setCities] = useState("Montreal, Laval");
  const [strategy, setStrategy] = useState<NonNullable<InvestorProfileInput["strategy"]>>("balanced");
  const [risk, setRisk] = useState<NonNullable<InvestorProfileInput["riskTolerance"]>>("medium");
  const [targetRoi, setTargetRoi] = useState("8");
  const [targetCf, setTargetCf] = useState("");
  const [horizon, setHorizon] = useState("7");

  useEffect(() => {
    void fetch("/api/investor/profile", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => {
        const p = j.profile;
        if (!p) return;
        setProfileId(p.id);
        if (p.budgetCents) setBudget(String(p.budgetCents / 100));
        if (p.downPaymentCents) setDown(String(p.downPaymentCents / 100));
        if (p.targetCities?.length) setCities(p.targetCities.join(", "));
        if (p.strategy) setStrategy(p.strategy as NonNullable<InvestorProfileInput["strategy"]>);
        if (p.riskTolerance) setRisk(p.riskTolerance as NonNullable<InvestorProfileInput["riskTolerance"]>);
        if (p.targetRoiPercent != null) setTargetRoi(String(p.targetRoiPercent));
        if (p.targetCashFlowCents) setTargetCf(String(p.targetCashFlowCents / 100));
        if (p.timeHorizonYears) setHorizon(String(p.timeHorizonYears));
      })
      .catch(() => {});
  }, []);

  const profilePayload = useMemo((): InvestorProfileInput => {
    const budgetCents = budget ? Math.round(Number(budget.replace(/,/g, "")) * 100) : null;
    const downCents = down ? Math.round(Number(down.replace(/,/g, "")) * 100) : null;
    return {
      budgetCents: Number.isFinite(budgetCents as number) ? budgetCents : null,
      downPaymentCents: Number.isFinite(downCents as number) ? downCents : null,
      targetCities: cities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      strategy,
      riskTolerance: risk,
      propertyTypes: ["Residential"],
      targetRoiPercent: targetRoi ? Number(targetRoi) : null,
      targetCashFlowCents: targetCf ? Math.round(Number(targetCf) * 100) : null,
      timeHorizonYears: horizon ? Number(horizon) : null,
    };
  }, [budget, cities, down, horizon, risk, strategy, targetCf, targetRoi]);

  const saveProfile = useCallback(async () => {
    await fetch("/api/investor/profile", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profilePayload),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.profile?.id) setProfileId(j.profile.id);
      });
  }, [profilePayload]);

  const runBuild = useCallback(async () => {
    setLoading(true);
    try {
      await saveProfile();
      const res = await fetch("/api/investor/portfolio/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profilePayload }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Build failed");
      setBuild(j);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Could not build portfolio. Try again.");
    } finally {
      setLoading(false);
    }
  }, [profilePayload, saveProfile]);

  async function saveScenario(scenario: PortfolioScenarioPreview) {
    const res = await fetch("/api/investor/portfolio", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: scenario.title,
        scenarioKind: scenario.kind,
        investorProfileId: profileId,
        totalBudgetCents: scenario.summary.totalPurchaseCents,
        totalDownPaymentCents: scenario.summary.totalDownCents,
        projectedMonthlyCashFlowCents: Math.round(scenario.summary.monthlyCashFlow * 100),
        projectedAnnualCashFlowCents: Math.round(scenario.summary.annualCashFlow * 100),
        projectedAverageRoiPercent: scenario.summary.avgRoi,
        projectedAverageCapRate: scenario.summary.avgCap,
        projectedRiskLevel: scenario.summary.riskLevel,
        projectedDiversificationScore: scenario.diversification.score,
        insightsJson: {
          strengths: scenario.insights.strengths,
          risks: scenario.insights.risks,
          opportunities: scenario.insights.opportunities,
          diversificationNotes: scenario.diversification.notes,
        },
        items: scenario.items.map((it) => ({
          listingId: it.listing.id,
          purchasePriceCents: it.listing.priceCents,
          estimatedRentCents: it.estimatedRentCents,
          projectedRoiPercent: it.roi.roiPercent,
          projectedCapRate: it.roi.capRatePercent,
          projectedCashFlowCents: Math.round(it.roi.monthlyCashFlow * 100),
          city: it.listing.city,
          propertyType: "Residential",
          riskLevel: it.deal.riskLevel,
          marketTrend: it.marketTrend,
          fitScore: it.fitScore,
          strengthSummary: [it.whyRecommended, ...it.strengths].join(" "),
        })),
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      alert(j.error === "Unauthorized" ? "Sign in to save scenarios." : "Save failed");
      return;
    }
    alert("Scenario saved. View it in Investor dashboard.");
    if (j.scenario?.id) {
      window.open(`/api/investor/portfolio/${j.scenario.id}/pdf`, "_blank");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-[#C9A646]">Planning tool</p>
        <h1 className="mt-2 text-3xl font-bold text-white">AI investor portfolio</h1>
        <p className="mt-2 text-sm text-slate-400">
          Estimates only — not advice. Step {step} of {STEPS}
        </p>
      </div>

      {step === 1 && (
        <section className="rounded-2xl border border-[#C9A646]/25 bg-black/50 p-6">
          <h2 className="text-lg font-semibold text-white">Step 1 — Goals</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-slate-400">
              Investment budget (CAD)
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 1500000"
              />
            </label>
            <label className="text-xs text-slate-400">
              Down payment pool (CAD)
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white"
                value={down}
                onChange={(e) => setDown(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-400 sm:col-span-2">
              Target cities (comma-separated)
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white"
                value={cities}
                onChange={(e) => setCities(e.target.value)}
              />
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-400">Strategy</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["cash_flow", "appreciation", "balanced"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStrategy(s)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      strategy === s ? "bg-[#C9A646] text-black" : "border border-white/20 text-white"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-6 rounded-xl bg-[#C9A646] px-6 py-3 text-sm font-bold text-black"
          >
            Next
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl border border-[#C9A646]/25 bg-black/50 p-6">
          <h2 className="text-lg font-semibold text-white">Step 2 — Risk & targets</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-400">Risk tolerance</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["low", "medium", "high"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRisk(r)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      risk === r ? "bg-[#C9A646] text-black" : "border border-white/20 text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <label className="text-xs text-slate-400">
              Target ROI % (illustrative)
              <input
                type="number"
                step="0.1"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white"
                value={targetRoi}
                onChange={(e) => setTargetRoi(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-400">
              Target monthly cash flow (CAD)
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white"
                value={targetCf}
                onChange={(e) => setTargetCf(e.target.value)}
                placeholder="optional"
              />
            </label>
            <label className="text-xs text-slate-400">
              Time horizon (years)
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-white"
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-white/20 px-6 py-3 text-sm text-white">
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void runBuild()}
              className="rounded-xl bg-[#C9A646] px-6 py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              {loading ? "Building…" : "Build suggested portfolio"}
            </button>
          </div>
        </section>
      )}

      {step === 3 && build && (
        <>
          <SummaryStrip profile={profilePayload} />
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Suggested portfolios (estimates)</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              {build.scenarios.map((sc) => (
                <ScenarioCard key={sc.kind} scenario={sc} onSave={() => void saveScenario(sc)} onCompare={() => sc.items.forEach((i) => add(i.listing.id))} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Recommended properties</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {build.recommended.map((it) => (
                <div key={it.listing.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex gap-3">
                    {it.listing.coverImage || it.listing.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.listing.coverImage ?? it.listing.images[0]!} alt="" className="h-20 w-28 rounded-lg object-cover" />
                    ) : (
                      <div className="h-20 w-28 rounded-lg bg-white/10" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#C9A646] line-clamp-2">{it.listing.title}</p>
                      <p className="text-xs text-slate-500">{it.listing.city}</p>
                      <p className="mt-1 text-sm text-white">${(it.listing.priceCents / 100).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-emerald-500/40 px-2 py-0.5 text-emerald-200">Fit {it.fitScore}</span>
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-slate-300">
                      ROI {it.roi.roiPercent.toFixed(1)}%
                    </span>
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-slate-300">
                      Cap {it.roi.capRatePercent.toFixed(1)}%
                    </span>
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-slate-300">
                      CF ${it.roi.monthlyCashFlow.toFixed(0)}/mo
                    </span>
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-slate-300">
                      Trend {it.marketTrend}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => add(it.listing.id)}
                      className="text-xs text-[#C9A646] hover:underline"
                    >
                      Add to compare
                    </button>
                    <Link href={`/sell/${it.listing.id}`} className="text-xs text-slate-400 hover:underline">
                      View listing
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <ExpertCtas />

          <p className="text-xs leading-relaxed text-slate-500">{PORTFOLIO_DISCLAIMER_TEXT}</p>
        </>
      )}
    </div>
  );
}

function SummaryStrip({ profile }: { profile: InvestorProfileInput }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-black/80 to-[#1a1508] p-6">
      <h3 className="text-sm font-semibold text-[#C9A646]">Investor summary (planning inputs)</h3>
      <div className="mt-3 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
        <p>
          Budget:{" "}
          <strong className="text-white">
            {profile.budgetCents ? `$${(profile.budgetCents / 100).toLocaleString()}` : "—"}
          </strong>
        </p>
        <p>
          Strategy: <strong className="text-white">{profile.strategy ?? "—"}</strong>
        </p>
        <p>
          Risk: <strong className="text-white">{profile.riskTolerance ?? "—"}</strong>
        </p>
      </div>
    </div>
  );
}

function ScenarioCard({
  scenario,
  onSave,
  onCompare,
}: {
  scenario: PortfolioScenarioPreview;
  onSave: () => void;
  onCompare: () => void;
}) {
  const s = scenario.summary;
  return (
    <div className="rounded-2xl border border-[#C9A646]/30 bg-black/60 p-5">
      <h3 className="font-semibold text-white">{scenario.title}</h3>
      <p className="mt-2 text-3xl font-bold text-[#C9A646]">{s.propertyCount} props</p>
      <ul className="mt-4 space-y-1 text-sm text-slate-300">
        <li>Avg ROI (est.): {s.avgRoi.toFixed(2)}%</li>
        <li>Avg cap (est.): {s.avgCap.toFixed(2)}%</li>
        <li>Monthly CF (est.): ${s.monthlyCashFlow.toFixed(0)}</li>
        <li>Risk: {s.riskLevel}</li>
        <li>Diversification: {scenario.diversification.score}/100</li>
      </ul>
      <p className="mt-3 text-xs text-slate-500">{scenario.diversification.notes[0] ?? ""}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onSave} className="rounded-lg bg-[#C9A646] px-3 py-2 text-xs font-bold text-black">
          Save scenario
        </button>
        <button type="button" onClick={onCompare} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white">
          Add all to compare
        </button>
      </div>
    </div>
  );
}

function ExpertCtas() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function send(kind: "broker" | "mortgage" | "plan") {
    setMsg(null);
    const res = await fetch("/api/investor/portfolio/lead", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, email, name, phone, note: "From portfolio planner" }),
    });
    const j = await res.json();
    if (!res.ok) setMsg(j.error ?? "Failed");
    else setMsg("Thanks — we'll route your request.");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="text-lg font-semibold text-white">Talk to an expert (lead — not advice)</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          placeholder="Email *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void send("broker")} className="rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-bold text-black">
          Broker
        </button>
        <button type="button" onClick={() => void send("mortgage")} className="rounded-lg border border-[#C9A646]/50 px-4 py-2 text-sm text-[#C9A646]">
          Mortgage expert
        </button>
        <button type="button" onClick={() => void send("plan")} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">
          Custom investment plan
        </button>
      </div>
      {msg ? <p className="mt-2 text-sm text-emerald-400">{msg}</p> : null}
    </section>
  );
}
