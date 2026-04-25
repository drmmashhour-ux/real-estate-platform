"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ComparableMap, { type MapComparable } from "@/components/map/ComparableMap";
import AutoAdjustmentPanel from "@/components/appraisal/AutoAdjustmentPanel";
import AdjustmentImpactChart, { type AdjustmentChartRow } from "@/components/appraisal/AdjustmentImpactChart";
import type { ComparableSummaryDto, DealAnalysisPublicDto } from "@/modules/deal-analyzer/domain/contracts";

const DEFAULT_CITY = "Laval";
const DEFAULT_LAT = 45.55;
const DEFAULT_LNG = -73.7;
const DEFAULT_RADIUS = 3;

export function AppraisalMapClient() {
  const searchParams = useSearchParams();
  const subjectListingId = searchParams.get("listingId") ?? "";
  const lecipmBrokerAppraisalCaseId = searchParams.get("caseId") ?? "";

  const [city, setCity] = useState(DEFAULT_CITY);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [pickCenterMode, setPickCenterMode] = useState(false);
  const [heatmapOn, setHeatmapOn] = useState(true);
  const [comps, setComps] = useState<MapComparable[]>([]);
  const [selected, setSelected] = useState<MapComparable[]>([]);
  const [loading, setLoading] = useState(false);
  const [addStatus, setAddStatus] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<DealAnalysisPublicDto | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisRunBusy, setAnalysisRunBusy] = useState(false);
  const [selectedComparableRowId, setSelectedComparableRowId] = useState<string | null>(null);
  const [chartRows, setChartRows] = useState<AdjustmentChartRow[]>([]);

  const canFeedAppraisal = subjectListingId.length > 0;
  const analysisId = analysis?.analysisId ?? null;
  const dealComps = useMemo(
    () => analysis?.phase2?.comparables?.items ?? [],
    [analysis],
  );

  const fetchAnalysis = useCallback(async () => {
    if (!subjectListingId) {
      setAnalysis(null);
      return;
    }
    setAnalysisLoading(true);
    try {
      const res = await fetch(`/api/deal-analyzer/properties/${subjectListingId}`);
      const data = (await res.json()) as { analysis?: DealAnalysisPublicDto | null; error?: string };
      if (!res.ok) {
        setAnalysis(null);
        return;
      }
      setAnalysis(data.analysis ?? null);
    } finally {
      setAnalysisLoading(false);
    }
  }, [subjectListingId]);

  useEffect(() => {
    void fetchAnalysis();
  }, [fetchAnalysis]);

  const refreshChart = useCallback(async () => {
    if (!analysisId || !selectedComparableRowId) {
      setChartRows([]);
      return;
    }
    const params = new URLSearchParams({
      appraisalCaseId: analysisId,
      comparableId: selectedComparableRowId,
    });
    const res = await fetch(`/api/appraisal/auto-adjustments?${params}`);
    const json = (await res.json()) as { chart?: AdjustmentChartRow[] };
    if (res.ok && json.chart) {
      setChartRows(json.chart);
    }
  }, [analysisId, selectedComparableRowId]);

  useEffect(() => {
    void refreshChart();
  }, [refreshChart]);

  const runDealAnalysis = useCallback(async () => {
    if (!subjectListingId) return;
    setAnalysisRunBusy(true);
    setAddStatus(null);
    try {
      const res = await fetch(`/api/deal-analyzer/properties/${subjectListingId}/run`, { method: "POST" });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setAddStatus(j.error ?? "Could not run analysis");
        return;
      }
      await fetchAnalysis();
      setAddStatus("Deal analysis refreshed.");
    } finally {
      setAnalysisRunBusy(false);
    }
  }, [subjectListingId, fetchAnalysis]);

  const loadRadius = useCallback(async () => {
    setLoading(true);
    setAddStatus(null);
    try {
      const res = await fetch("/api/comparables/radius-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          lat: center.lat,
          lng: center.lng,
          radiusKm,
        }),
      });
      const data = (await res.json()) as { success?: boolean; comps?: MapComparable[]; error?: string };
      if (!res.ok) {
        setComps([]);
        setAddStatus(data.error ?? "Search failed");
        return;
      }
      setComps(data.comps ?? []);
    } finally {
      setLoading(false);
    }
  }, [city, center.lat, center.lng, radiusKm]);

  const linkComparableRow = useCallback((mapComp: MapComparable) => {
    const row = dealComps.find((d) => d.comparablePropertyId === mapComp.id);
    if (row) {
      setSelectedComparableRowId(row.comparableRowId);
    }
  }, [dealComps]);

  const onMapSelect = useCallback(
    async (c: MapComparable) => {
      setSelected((prev) => (prev.some((p) => p.id === c.id) ? prev : [...prev, c]));
      linkComparableRow(c);
      if (!canFeedAppraisal) {
        setAddStatus("Add ?listingId=… to the URL to push comps into Deal Analyzer.");
        return;
      }
      setAddStatus(null);
      const res = await fetch("/api/appraisal/add-comparable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectListingId,
          comparablePropertyId: c.id,
          ...(lecipmBrokerAppraisalCaseId ? { lecipmBrokerAppraisalCaseId } : {}),
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; deduped?: boolean };
      if (!res.ok) {
        setAddStatus(data.error ?? "Could not attach comparable");
        return;
      }
      setAddStatus(data.deduped ? "Already in analysis." : "Added to deal analysis comparables.");
      await fetchAnalysis();
      linkComparableRow(c);
    },
    [canFeedAppraisal, subjectListingId, lecipmBrokerAppraisalCaseId, fetchAnalysis, linkComparableRow],
  );

  const hint = useMemo(
    () =>
      canFeedAppraisal
        ? `Valuation stack active for listing ${subjectListingId.slice(0, 8)}…`
        : "Open with ?listingId=<FSBO id> to connect map picks to Deal Analyzer, adjustments, and AI.",
    [canFeedAppraisal, subjectListingId],
  );

  const compSummary = analysis?.phase2?.comparables?.summary;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.09),transparent),#060606] text-white">
      <header className="border-b border-white/10 bg-black/50 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#D4AF37]/80">
              LECIPM · Map intelligence
            </p>
            <h1 className="font-serif text-2xl font-semibold text-white sm:text-3xl">Comparable valuation desk</h1>
            <p className="mt-1 max-w-xl text-sm text-white/60">{hint}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canFeedAppraisal ? (
              <button
                type="button"
                onClick={runDealAnalysis}
                disabled={analysisRunBusy || analysisLoading}
                className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-xs font-semibold text-[#D4AF37] disabled:opacity-50"
              >
                {analysisRunBusy ? "Running…" : "Refresh analysis"}
              </button>
            ) : null}
            <Link
              href="/dashboard/investor/acquisition"
              className="text-xs font-medium text-[#D4AF37] underline-offset-4 hover:underline"
            >
              Acquisition hub
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start lg:gap-5 lg:p-6">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/35 p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              <label className="col-span-2 flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-white/45 sm:col-span-1">
                Market
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-lg border border-white/12 bg-black/55 px-2.5 py-2 text-sm text-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-white/45">
                Radius km
                <input
                  type="number"
                  min={0.5}
                  max={50}
                  step={0.5}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/12 bg-black/55 px-2.5 py-2 text-sm text-white"
                />
              </label>
              <div className="flex flex-col justify-end text-[10px] text-white/50">
                <span className="uppercase tracking-wide text-white/40">Center</span>
                <span className="font-mono text-xs text-white/80">
                  {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPickCenterMode((v) => !v)}
                className={`flex h-full min-h-[40px] items-center justify-center rounded-lg px-2 text-xs font-semibold ${
                  pickCenterMode ? "bg-[#D4AF37] text-black" : "border border-white/15 bg-white/[0.04] text-white"
                }`}
              >
                {pickCenterMode ? "Pick on map" : "Set center"}
              </button>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-white/75">
                <input type="checkbox" checked={heatmapOn} onChange={(e) => setHeatmapOn(e.target.checked)} />
                Heat
              </label>
              <button
                type="button"
                onClick={loadRadius}
                disabled={loading}
                className="col-span-2 flex min-h-[40px] items-center justify-center rounded-lg bg-[#D4AF37] text-sm font-semibold text-black disabled:opacity-50 lg:col-span-2"
              >
                {loading ? "Searching…" : "Search radius"}
              </button>
            </div>
          </div>

          {addStatus ? (
            <p className="text-sm text-amber-200/90" role="status">
              {addStatus}
            </p>
          ) : null}

          <ComparableMap
            comps={comps}
            onSelect={onMapSelect}
            heatmapEnabled={heatmapOn}
            circleCenter={center}
            circleRadiusKm={radiusKm}
            pickCenterMode={pickCenterMode}
            onPickCenter={(ll) => {
              setCenter({ lat: ll.lat, lng: ll.lng });
              setPickCenterMode(false);
            }}
            className="min-h-[420px] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)]"
          />

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <h2 className="font-serif text-sm font-semibold text-[#D4AF37]">Map selections</h2>
            {selected.length === 0 ? (
              <p className="mt-2 text-xs text-white/50">
                Tap markers to shortlist. With a subject listing, picks feed comparables for positioning and
                adjustments.
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {selected.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/85"
                  >
                    <span className="text-white/90">{c.address.slice(0, 32)}</span>
                    <span className="ml-2 text-[#D4AF37]">
                      ${((c.salePriceCents ?? c.priceCents) / 100).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto lg:pr-1">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/70 to-black/40 p-4">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[#D4AF37]/80">Valuation engine</div>
            {!subjectListingId ? (
              <p className="mt-2 text-xs text-white/50">Subject listing required for live scores.</p>
            ) : analysisLoading ? (
              <p className="mt-2 text-xs text-white/50">Loading analysis…</p>
            ) : !analysis ? (
              <p className="mt-2 text-xs text-white/55">
                No analysis yet. Run from the header to unlock comparables, AI adjustments, and charts.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                  <div className="text-white/45">Investment</div>
                  <div className="font-serif text-lg text-white">{analysis.investmentScore}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                  <div className="text-white/45">Risk</div>
                  <div className="font-serif text-lg text-white">{analysis.riskScore}</div>
                </div>
                <div className="col-span-2 rounded-lg border border-white/10 bg-black/30 p-2">
                  <div className="text-white/45">Confidence</div>
                  <div className="text-sm capitalize text-[#D4AF37]">{analysis.confidenceLevel}</div>
                </div>
                {compSummary ? (
                  <div className="col-span-2 rounded-lg border border-white/10 bg-black/25 p-2 text-[11px] text-white/65">
                    <span className="text-white/40">Comps in model:</span>{" "}
                    {compSummary.comparableCount ?? dealComps.length}
                    {compSummary.medianPriceCents != null ? (
                      <>
                        {" "}
                        · <span className="text-white/40">Median</span> $
                        {(compSummary.medianPriceCents / 100).toLocaleString()}
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">Analysis comparable</div>
            <p className="mt-1 text-xs text-white/50">
              Choose a row for adjustments & AI. Map picks auto-link when the comp is already in the analysis pool.
            </p>
            {dealComps.length === 0 ? (
              <p className="mt-2 text-xs text-amber-200/70">Add comps via map or refresh analysis.</p>
            ) : (
              <select
                className="mt-3 w-full rounded-lg border border-white/12 bg-black/60 py-2.5 pl-3 pr-2 text-sm text-white"
                value={selectedComparableRowId ?? ""}
                onChange={(e) => setSelectedComparableRowId(e.target.value || null)}
              >
                <option value="">Select comparable…</option>
                {dealComps.map((d: ComparableSummaryDto) => (
                  <option key={d.comparableRowId} value={d.comparableRowId}>
                    ${(d.priceCents / 100).toLocaleString()} · {d.propertyType ?? "—"} · score{" "}
                    {d.similarityScore.toFixed(2)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {analysisId && selectedComparableRowId ? (
            <>
              <AutoAdjustmentPanel
                appraisalCaseId={analysisId}
                comparableId={selectedComparableRowId}
                onRefresh={refreshChart}
              />
              <AdjustmentImpactChart data={chartRows} />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-xs text-white/45">
              Select an analysis comparable to enable adjustment proposals and the original vs adjusted chart.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
