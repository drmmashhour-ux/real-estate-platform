"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type ResidenceRow = {
  id: string;
  name: string;
  city: string;
  province: string;
  careLevel: string;
  verified: boolean;
  basePrice: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
};

type MatchRow = { residenceId: string; score: number; explanation?: string[]; reasons?: string[] };

export function SeniorLivingHubClient(props: {
  locale: string;
  country: string;
  initialResidences: ResidenceRow[];
}) {
  const base = `/${props.locale}/${props.country}`;
  const [city, setCity] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [careLevel, setCareLevel] = useState("");
  const [rows, setRows] = useState(initialResidences);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [budget, setBudget] = useState("");
  const [mobilityLevel, setMobilityLevel] = useState("");
  const [medicalNeeds, setMedicalNeeds] = useState("");
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [insights, setInsights] = useState<{ kind: string; message: string }[] | null>(null);
  const [matchBusy, setMatchBusy] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (city.trim()) q.set("city", city.trim());
      if (careLevel) q.set("careLevel", careLevel);
      if (verifiedOnly) q.set("verifiedOnly", "1");
      const res = await fetch(`/api/senior/residences?${q.toString()}`);
      const j = (await res.json()) as { residences?: ResidenceRow[] };
      setRows(j.residences ?? []);
    } finally {
      setLoading(false);
    }
  }, [city, careLevel, verifiedOnly]);

  const runMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatchBusy(true);
    setMatches(null);
    setInsights(null);
    try {
      const res = await fetch("/api/senior/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Family member",
          preferredCity: preferredCity || undefined,
          budget: budget ? Number(budget) : undefined,
          mobilityLevel: mobilityLevel || undefined,
          medicalNeeds: medicalNeeds || undefined,
        }),
      });
      const j = (await res.json()) as {
        matches?: MatchRow[];
        insights?: { kind: string; message: string }[];
      };
      setMatches(j.matches ?? []);
      setInsights(j.insights ?? []);
    } finally {
      setMatchBusy(false);
    }
  };

  return (
    <div className="space-y-14">
      <section className="rounded-2xl border border-slate-700/80 bg-slate-950/60 p-6 md:p-8">
        <h2 className="text-lg font-semibold text-slate-100">Find residences</h2>
        <p className="mt-2 text-sm text-slate-400">
          Filter by location and care level. Verified listings carry an on-platform diligence badge.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <input
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            placeholder="City"
            value={city}
            onChange={(ev) => setCity(ev.target.value)}
          />
          <select
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={careLevel}
            onChange={(ev) => setCareLevel(ev.target.value)}
          >
            <option value="">Care level — any</option>
            <option value="AUTONOMOUS">Autonomous</option>
            <option value="SEMI_AUTONOMOUS">Semi-autonomous</option>
            <option value="ASSISTED">Assisted</option>
            <option value="FULL_CARE">Full care</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={verifiedOnly} onChange={(ev) => setVerifiedOnly(ev.target.checked)} />
            Verified only
          </label>
          <button
            type="button"
            onClick={() => void search()}
            disabled={loading}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
          >
            {loading ? "Searching…" : "Apply filters"}
          </button>
        </div>

        <ul className="mt-8 divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
          {rows.length === 0 ?
            <li className="px-4 py-8 text-center text-sm text-slate-500">No residences match yet.</li>
          : rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 hover:bg-slate-900/50">
                <div>
                  <Link className="font-medium text-teal-300 hover:underline" href={`${base}/senior-living/${r.id}`}>
                    {r.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {r.city}, {r.province} · {r.careLevel.replace(/_/g, " ").toLowerCase()}
                    {r.verified ?
                      <span className="ml-2 rounded bg-teal-950 px-2 py-0.5 text-teal-300">Verified</span>
                    : null}
                  </p>
                </div>
                <div className="text-right text-sm text-slate-400">
                  {r.priceRangeMin != null && r.priceRangeMax != null ?
                    `$${Math.round(r.priceRangeMin)} – $${Math.round(r.priceRangeMax)} / mo`
                  : r.basePrice != null ?
                    `From $${Math.round(r.basePrice)} / mo`
                  : "Pricing on inquiry"}
                </div>
              </li>
            ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-950/60 p-6 md:p-8">
        <h2 className="text-lg font-semibold text-slate-100">Guided matching</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Tell us about mobility, clinical-adjacent needs, and budget. We score options for transparency — not a medical
          assessment.
        </p>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={runMatch}>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Name (optional label)
            <input
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Preferred city
            <input
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={preferredCity}
              onChange={(ev) => setPreferredCity(ev.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Monthly budget (CAD)
            <input
              type="number"
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={budget}
              onChange={(ev) => setBudget(ev.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Mobility
            <select
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={mobilityLevel}
              onChange={(ev) => setMobilityLevel(ev.target.value)}
            >
              <option value="">—</option>
              <option value="INDEPENDENT">Independent</option>
              <option value="LIMITED">Limited</option>
              <option value="DEPENDENT">Dependent</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400 md:col-span-2">
            Medical / cognitive support needs (self-reported)
            <select
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={medicalNeeds}
              onChange={(ev) => setMedicalNeeds(ev.target.value)}
            >
              <option value="">—</option>
              <option value="NONE">None stated</option>
              <option value="LIGHT">Light</option>
              <option value="HEAVY">Heavy</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={matchBusy}
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
            >
              {matchBusy ? "Matching…" : "See recommendations"}
            </button>
          </div>
        </form>

        {insights && insights.length > 0 ?
          <ul className="mt-6 space-y-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
            {insights.map((i, idx) => (
              <li key={idx}>
                <span className="font-medium text-teal-400">{i.kind}:</span> {i.message}
              </li>
            ))}
          </ul>
        : null}

        {matches && matches.length > 0 ?
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Top matches</h3>
            <ul className="space-y-4">
              {matches.slice(0, 8).map((m) => (
                <li
                  key={m.residenceId}
                  className="rounded-xl border border-slate-800 bg-slate-900/30 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link className="font-medium text-teal-300 hover:underline" href={`${base}/senior-living/${m.residenceId}`}>
                      View residence
                    </Link>
                    <span className="font-mono text-teal-400">{m.score}/100</span>
                  </div>
                  <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
                    {(m.explanation ?? m.reasons ?? []).slice(0, 4).map((r, j) => (
                      <li key={j}>{r}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        : null}
      </section>
    </div>
  );
}
