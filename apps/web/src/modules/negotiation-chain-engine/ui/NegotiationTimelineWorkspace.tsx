"use client";

import { useEffect, useMemo, useState } from "react";
import { useNegotiationChainSnapshot } from "@/src/modules/negotiation-chain-engine/hooks/useNegotiationChainSnapshot";
import { NEGOTIATION_IMMUTABLE_VERSION, NEGOTIATION_NOT_LEGAL_ADVICE } from "@/src/modules/negotiation-chain-engine/policies/negotiationChainPolicy";
import { CurrentActiveTermsCard } from "@/src/modules/negotiation-chain-engine/ui/CurrentActiveTermsCard";
import { NegotiationSummaryBar } from "@/src/modules/negotiation-chain-engine/ui/NegotiationSummaryBar";
import { NegotiationTimeline } from "@/src/modules/negotiation-chain-engine/ui/NegotiationTimeline";
import { VersionComparisonPanel } from "@/src/modules/negotiation-chain-engine/ui/VersionComparisonPanel";

export function NegotiationTimelineWorkspace({
  listingId,
  documentId,
  compact,
}: {
  listingId: string;
  documentId?: string | null;
  compact?: boolean;
}) {
  const { data, error, loading, reload } = useNegotiationChainSnapshot(listingId, documentId);
  const [presetFrom, setPresetFrom] = useState(0);
  const [presetTo, setPresetTo] = useState(0);

  const history = data?.history ?? [];
  const sorted = useMemo(() => [...history].sort((a, b) => a.versionNumber - b.versionNumber), [history]);
  const maxIdx = Math.max(0, sorted.length - 1);

  const chainFingerprint = sorted.map((x) => x.id).join(",");
  useEffect(() => {
    setPresetTo(maxIdx);
  }, [maxIdx, chainFingerprint]);

  const lastUpdatedIso = useMemo(() => {
    if (!sorted.length) return data?.activeVersion?.createdAt ? String(data.activeVersion.createdAt) : null;
    const latest = [...sorted].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
    return latest?.createdAt ? String(latest.createdAt) : null;
  }, [sorted, data?.activeVersion]);

  const documentHref = documentId ? `/admin/case-command-center/${documentId}` : null;

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="h-16 rounded-lg bg-white/5" />
        <div className="h-40 rounded-lg bg-white/5" />
      </div>
    );
  }
  if (error) return <p className="text-xs text-rose-300">{error}</p>;
  if (!data?.chain) {
    return (
      <p className="text-xs text-slate-500">
        No negotiation chain for this listing/case yet — create an opening offer to start.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!compact ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-premium-gold">Negotiation chain (versioned)</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            {NEGOTIATION_IMMUTABLE_VERSION} {NEGOTIATION_NOT_LEGAL_ADVICE}
          </p>
        </div>
      ) : null}

      <NegotiationSummaryBar
        chainStatus={data.chain.status}
        activeVersion={data.activeVersion}
        lastUpdatedIso={lastUpdatedIso}
      />

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start lg:gap-6">
        <aside className="order-1 w-full lg:sticky lg:top-4 lg:order-2 lg:col-start-2 lg:row-span-2 lg:self-start">
          <CurrentActiveTermsCard version={data.activeVersion} />
        </aside>
        <div className="order-2 min-w-0 space-y-4 lg:order-1 lg:col-start-1">
          <NegotiationTimeline
            history={history}
            activeVersion={data.activeVersion}
            onPresetCompare={(from, to) => {
              setPresetFrom(from);
              setPresetTo(to);
            }}
            documentHref={documentHref}
            collapsibleDiff={!!compact}
          />
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">Compare versions</p>
            <VersionComparisonPanel
              key={sorted.map((x) => x.id).join("-")}
              history={history}
              presetFromIndex={presetFrom}
              presetToIndex={presetTo}
            />
          </div>
        </div>
      </div>

      {!compact ? (
        <button
          type="button"
          onClick={() => void reload()}
          className="text-[10px] text-slate-500 underline decoration-white/20 underline-offset-2 hover:text-slate-300"
        >
          Refresh
        </button>
      ) : null}
    </div>
  );
}
