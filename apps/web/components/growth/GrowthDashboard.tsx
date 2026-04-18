"use client";

import { useCallback, useEffect, useState } from "react";
import { OpportunityHeatmap } from "./OpportunityHeatmap";
import { SupplyDemandMap } from "./SupplyDemandMap";
import { FunnelChart } from "./FunnelChart";
import { AcquisitionPanel } from "./AcquisitionPanel";
import { ReferralPanel } from "./ReferralPanel";
import type { FunnelReport } from "@/modules/growth-funnel/funnel.types";
import type { MontrealMarketSnapshot, MontrealOpportunityRow } from "@/modules/market-intelligence/market-intelligence.types";

type SupplyBundle = {
  snapshotGeneratedAt: string;
  targets: (MontrealOpportunityRow & { priority?: string; rationale?: string })[];
};

export function GrowthDashboard({
  showSupply,
  showDemand,
  showReferrals,
  showDomination,
}: {
  showSupply: boolean;
  showDemand: boolean;
  showReferrals: boolean;
  showDomination: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<MontrealMarketSnapshot | null>(null);
  const [domination, setDomination] = useState<unknown>(null);
  const [supply, setSupply] = useState<SupplyBundle | null>(null);
  const [demand, setDemand] = useState<unknown>(null);
  const [funnels, setFunnels] = useState<{
    guest: FunnelReport;
    host: FunnelReport;
    buyer: FunnelReport;
    broker: FunnelReport;
  } | null>(null);
  const [referralData, setReferralData] = useState<{
    aggregates: { totalAllTime: number; total90d: number; statusBreakdown: Record<string, number> };
    recent: { id: string; code: string; status: string; inviteKind: string | null; createdAt: string }[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const marketUrl = showDomination ? "/api/growth/market?includeDomination=1" : "/api/growth/market";
      const [mRes, fRes] = await Promise.all([fetch(marketUrl), fetch("/api/growth/funnel")]);
      const mJson = await mRes.json();
      const fJson = await fRes.json();
      if (!mRes.ok) throw new Error(mJson.error || mRes.statusText);
      if (!fRes.ok) throw new Error(fJson.error || fRes.statusText);

      setSnapshot(mJson.snapshot);
      setDomination(mJson.domination ?? null);
      setFunnels(fJson.funnels);

      const optional: Promise<void>[] = [];

      if (showSupply) {
        optional.push(
          fetch("/api/growth/supply")
            .then((r) => r.json())
            .then((j) => {
              if (j.bundle) setSupply(j.bundle);
              else setSupply(null);
            })
            .catch(() => setSupply(null))
        );
      } else setSupply(null);

      if (showDemand) {
        optional.push(
          fetch("/api/growth/demand")
            .then((r) => r.json())
            .then((j) => {
              if (j.snapshot) setDemand(j.snapshot);
              else setDemand(null);
            })
            .catch(() => setDemand(null))
        );
      } else setDemand(null);

      if (showReferrals) {
        optional.push(
          fetch("/api/growth/referrals")
            .then((r) => r.json())
            .then((j) => {
              if (j.aggregates)
                setReferralData({ aggregates: j.aggregates, recent: j.recent ?? [] });
              else setReferralData(null);
            })
            .catch(() => setReferralData(null))
        );
      } else setReferralData(null);

      await Promise.all(optional);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load growth data");
    } finally {
      setLoading(false);
    }
  }, [showSupply, showDemand, showReferrals, showDomination]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
        Loading Montréal growth intelligence…
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-sm text-red-200">
        {err}
        <button
          type="button"
          className="ml-3 rounded border border-red-800 px-2 py-1 text-xs"
          onClick={() => void load()}
        >
          Retry
        </button>
      </div>
    );
  }

  const opps = snapshot?.opportunities ?? [];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100/90">
        <p className="font-medium text-amber-200">LECIPM Growth Engine v1</p>
        <p className="mt-1 text-xs text-amber-200/80">
          All figures are from internal platform data. Outreach and SEO outputs are drafts — human review before publish or
          send.
        </p>
        {snapshot?.disclaimers?.length ? (
          <ul className="mt-2 list-inside list-disc text-xs text-amber-200/70">
            {snapshot.disclaimers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SupplyDemandMap rows={opps} />
        <OpportunityHeatmap opportunities={opps} />
      </div>

      {domination && showDomination ? (
        <details className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-200">Domination strategy (waves)</summary>
          <pre className="mt-3 max-h-64 overflow-auto text-xs text-slate-400">{JSON.stringify(domination, null, 2)}</pre>
        </details>
      ) : null}

      {funnels ? (
        <div className="grid gap-4 md:grid-cols-2">
          <FunnelChart report={funnels.guest} title="Guest (BNHub)" />
          <FunnelChart report={funnels.host} title="Host (BNHub)" />
          <FunnelChart report={funnels.buyer} title="Buyer / FSBO" />
          <FunnelChart report={funnels.broker} title="Broker platform" />
        </div>
      ) : null}

      {showSupply && supply ? (
        <AcquisitionPanel
          snapshotGeneratedAt={supply.snapshotGeneratedAt}
          targets={supply.targets}
          onRefresh={() => void load()}
        />
      ) : null}

      {showDemand && demand ? (
        <details className="rounded-xl border border-slate-800 bg-slate-900/40 p-4" open>
          <summary className="cursor-pointer text-sm font-medium text-slate-200">Demand & attribution snapshot</summary>
          <pre className="mt-3 max-h-64 overflow-auto text-xs text-slate-400">{JSON.stringify(demand, null, 2)}</pre>
        </details>
      ) : null}

      {showReferrals && referralData ? (
        <ReferralPanel aggregates={referralData.aggregates} recent={referralData.recent} />
      ) : null}
    </div>
  );
}
