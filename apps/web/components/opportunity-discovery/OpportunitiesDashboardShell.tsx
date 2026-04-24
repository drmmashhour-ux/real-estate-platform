"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

type OppRow = {
  id: string;
  entityType: string;
  entityId: string;
  opportunityType: string;
  score: number;
  confidenceScore: number;
  riskLevel: string;
  rationaleJson: unknown;
  status: string;
  city: string | null;
  propertyType: string | null;
  marketSegment: string | null;
  investorReady: boolean;
  esgRelevant: boolean;
  discoveredAt: string;
};

const card =
  "rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-200 shadow-[0_0_40px_rgb(0_0_0_/_0.35)]";
const btn =
  "rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-1 text-xs font-semibold text-[#f4efe4] hover:bg-[#D4AF37]/20";

function rationaleSummary(r: unknown): string {
  if (!r || typeof r !== "object") return "";
  const s = (r as { summary?: string }).summary;
  return typeof s === "string" ? s : "";
}

function nextActions(r: unknown): string[] {
  if (!r || typeof r !== "object") return [];
  const a = (r as { suggestedNextActions?: string[] }).suggestedNextActions;
  return Array.isArray(a) ? a : [];
}

export function OpportunitiesDashboardShell() {
  const [rows, setRows] = useState<OppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [opportunityType, setOpportunityType] = useState("");
  const [minScore, setMinScore] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [esgOnly, setEsgOnly] = useState(false);
  const [investorOnly, setInvestorOnly] = useState(false);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (city.trim()) sp.set("city", city.trim());
    if (opportunityType) sp.set("opportunityType", opportunityType);
    if (minScore) sp.set("minScore", minScore);
    if (riskLevel) sp.set("riskLevel", riskLevel);
    if (esgOnly) sp.set("esgRelevant", "1");
    if (investorOnly) sp.set("investorReady", "1");
    return sp.toString();
  }, [city, opportunityType, minScore, riskLevel, esgOnly, investorOnly]);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/opportunities?${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "load failed");
      setRows(data.opportunities ?? []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refreshDiscovery() {
    const res = await fetch("/api/opportunities/refresh", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "refresh failed");
      return;
    }
    setMsg(`Refresh complete — ${data.persisted ?? 0} row(s) upserted, ${data.count ?? 0} discovered.`);
    void load();
  }

  async function mark(id: string, path: "mark-reviewed" | "dismiss") {
    const res = await fetch(`/api/opportunities/${id}/${path}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? path);
      return;
    }
    void load();
  }

  const grouped = useMemo(() => {
    const g: Record<string, OppRow[]> = {};
    for (const r of rows) {
      g[r.opportunityType] = g[r.opportunityType] ?? [];
      g[r.opportunityType]!.push(r);
    }
    return g;
  }, [rows]);

  const top = useMemo(() => [...rows].sort((a, b) => b.score - a.score).slice(0, 8), [rows]);

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-[#f4efe4] md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]/80">LECIPM · BNHub</p>
            <h1 className="mt-2 font-serif text-3xl">Opportunity Discovery</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400">
              Recommendations only — every card includes confidence, risk flags, and plain-language rationale. No automatic actions; no guaranteed ROI.
            </p>
            {msg ? <p className="mt-2 text-xs text-neutral-500">{msg}</p> : null}
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <button type="button" className={btn} onClick={() => void refreshDiscovery()}>
              Run discovery &amp; save
            </button>
            <button type="button" className={btn} onClick={() => void load()}>
              Apply filters
            </button>
            <Link href="/dashboard/execution" className="text-xs text-[#D4AF37]/90 hover:underline">
              Execution desk →
            </Link>
          </div>
        </header>

        <section className={card}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/90">Filters</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-300">
            <label className="flex flex-col gap-1">
              City contains
              <input
                className="rounded border border-white/15 bg-black/40 px-2 py-1 text-[#f4efe4]"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Montreal"
              />
            </label>
            <label className="flex flex-col gap-1">
              Opportunity type
              <select
                className="rounded border border-white/15 bg-black/40 px-2 py-1 text-[#f4efe4]"
                value={opportunityType}
                onChange={(e) => setOpportunityType(e.target.value)}
              >
                <option value="">All</option>
                <option value="UNDERVALUED">Underpriced</option>
                <option value="VALUE_ADD">Investment upside</option>
                <option value="HIGH_DEMAND">High demand / broker</option>
                <option value="ESG_UPSIDE">ESG / retrofit</option>
                <option value="INVESTOR_FIT">Investor fit</option>
                <option value="ARBITRAGE">STR</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              Min score
              <input
                className="w-24 rounded border border-white/15 bg-black/40 px-2 py-1 text-[#f4efe4]"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                placeholder="50"
              />
            </label>
            <label className="flex flex-col gap-1">
              Risk
              <select
                className="rounded border border-white/15 bg-black/40 px-2 py-1 text-[#f4efe4]"
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
              >
                <option value="">All</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </label>
            <label className="mt-6 flex items-center gap-2">
              <input type="checkbox" checked={esgOnly} onChange={(e) => setEsgOnly(e.target.checked)} />
              ESG relevant
            </label>
            <label className="mt-6 flex items-center gap-2">
              <input type="checkbox" checked={investorOnly} onChange={(e) => setInvestorOnly(e.target.checked)} />
              Investor-ready
            </label>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/90">Top opportunities now</h2>
          {loading ?
            <p className="text-sm text-neutral-500">Loading…</p>
          : <div className="grid gap-3 md:grid-cols-2">{top.map((r) => opportunityCard(r, mark))}</div>}
        </section>

        {["UNDERVALUED", "VALUE_ADD", "ESG_UPSIDE", "ARBITRAGE", "HIGH_DEMAND", "INVESTOR_FIT"].map((k) => {
          const list = grouped[k] ?? [];
          if (list.length === 0) return null;
          const label =
            k === "UNDERVALUED" ? "Underpriced listings"
            : k === "VALUE_ADD" ? "Investment upside deals"
            : k === "ESG_UPSIDE" ? "ESG / retrofit"
            : k === "ARBITRAGE" ? "Short-term rental"
            : k === "HIGH_DEMAND" ? "Broker priority leads"
            : "Investor fit";
          return (
            <section key={k}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/90">{label}</h2>
              <div className="grid gap-3 md:grid-cols-2">{list.map((r) => opportunityCard(r, mark))}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function opportunityCard(
  r: OppRow,
  mark: (id: string, path: "mark-reviewed" | "dismiss") => void,
): ReactNode {
  const actions = nextActions(r.rationaleJson);
  return (
    <div key={r.id} className={card}>
      <p className="text-[10px] uppercase text-neutral-500">
        {r.opportunityType.replace(/_/g, " ")} · {r.entityType} · {r.status}
      </p>
      <p className="mt-1 text-lg font-semibold text-[#f4efe4]">
        Score {r.score}{" "}
        <span className="text-sm font-normal text-neutral-400">· confidence {r.confidenceScore}</span>
      </p>
      <p className="text-xs text-amber-200/90">Risk: {r.riskLevel}</p>
      <p className="mt-2 text-xs text-neutral-300">{rationaleSummary(r.rationaleJson)}</p>
      <p className="mt-1 text-[10px] text-neutral-500">
        {r.city ? `${r.city} · ` : ""}
        {r.propertyType ?? ""} {r.marketSegment ? `· ${r.marketSegment}` : ""}
        {r.esgRelevant ? " · ESG" : ""}
        {r.investorReady ? " · Investor-ready" : ""}
      </p>
      {actions.length > 0 ?
        <ul className="mt-2 list-inside list-disc text-[11px] text-neutral-500">
          {actions.slice(0, 4).map((a) => (
            <li key={a.slice(0, 40)}>{a}</li>
          ))}
        </ul>
      : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => mark(r.id, "mark-reviewed")}>
          Mark reviewed
        </button>
        <button type="button" className={btn} onClick={() => mark(r.id, "dismiss")}>
          Dismiss
        </button>
        <Link href="/dashboard/command-center" className={`${btn} inline-block text-center`}>
          Open command cockpit
        </Link>
      </div>
    </div>
  );
}
