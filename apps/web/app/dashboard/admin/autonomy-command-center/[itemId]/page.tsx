"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { AutopilotReviewBundle } from "@/modules/autopilot-review/autopilot-review.service";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "@/components/autonomy/autonomy-styles";

type ExecutionPayload = {
  kind: "execution";
  detail: {
    reviewHints: Record<string, unknown>;
    reviewBundle: AutopilotReviewBundle;
    execution: Record<string, unknown>;
    platformAutopilotAction?: unknown;
  };
};

type ApprovalPayload = {
  kind: "approval_action";
  approval: {
    id: string;
    domain: string;
    actionType: string;
    summary?: string | null;
    riskLevel?: string | null;
    status?: string | null;
    recommendedPayload?: unknown;
    decisions?: Array<Record<string, unknown>>;
  };
};

type ItemPayload = ExecutionPayload | ApprovalPayload;

export default function AutonomyCommandCenterDrilldownPage() {
  const params = useParams();
  const itemId = typeof params?.itemId === "string" ? params.itemId : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ItemPayload | null>(null);

  useEffect(() => {
    if (!itemId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/autonomy-command-center/item/${itemId}`);
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(typeof j?.error === "string" ? j.error : "not_found");
          return;
        }
        if (!cancelled) setPayload(j as ItemPayload);
      } catch {
        if (!cancelled) setError("network_error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-[#f4efe4]">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/dashboard/admin/autonomy-command-center" className="text-sm text-[#D4AF37] hover:underline">
          ← Back to Command Center
        </Link>

        <header className={`${autonomyGlassCard} p-6`}>
          <p className={`text-xs uppercase tracking-[0.3em] ${autonomyMuted}`}>Drilldown</p>
          <h1 className={`font-serif text-3xl ${autonomyGoldText}`}>Autonomy decision trace</h1>
          <p className={`mt-2 text-sm ${autonomyMuted}`}>
            Explanation bundle — policy outcome, signals, orchestration linkage, and structured review payload where
            available.
          </p>
          <p className="mt-3 font-mono text-xs text-[#a39e93]">{itemId}</p>
        </header>

        {loading ?
          <p className="text-sm text-[#b8b3a8]">Loading trace…</p>
        : null}
        {error ?
          <p className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">{error}</p>
        : null}

        {!loading && payload?.kind === "execution" ?
          <ExecutionExplain detail={payload.detail} />
        : null}

        {!loading && payload?.kind === "approval_action" ?
          <ApprovalExplain approval={payload.approval} />
        : null}

        {!loading && payload ?
          <pre
            className={`${autonomyGlassCard} max-h-[40vh] overflow-auto p-5 font-mono text-[10px] leading-relaxed text-[#9a958a]`}
          >
            {JSON.stringify(payload, null, 2)}
          </pre>
        : null}
      </div>
    </div>
  );
}

function ExecutionExplain(props: { detail: ExecutionPayload["detail"] }) {
  const b = props.detail.reviewBundle;
  return (
    <div className={`${autonomyGlassCard} space-y-5 p-6`}>
      <section>
        <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Policy & explanation</h2>
        <p className={`mt-2 text-sm ${autonomyMuted}`}>{b.policy.explanationText}</p>
        <dl className={`mt-3 grid gap-2 text-sm ${autonomyMuted}`}>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[#c9b667]">Outcome</dt>
            <dd className="text-[#f4efe4]">{b.policy.outcome}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[#c9b667]">Risk</dt>
            <dd className="text-[#f4efe4]">{b.policy.riskLevel}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[#c9b667]">Rule</dt>
            <dd className="font-mono text-xs text-[#e8dfd0]">{b.policy.ruleId}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#c9b667]">Input signals</h3>
        <pre className={`mt-2 whitespace-pre-wrap rounded-xl border border-[#D4AF37]/15 bg-black/50 p-4 text-xs text-[#e8dfd0]`}>
          {b.inputSummary}
        </pre>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#c9b667]">Outcome telemetry</h3>
        <pre className={`mt-2 overflow-auto rounded-xl border border-[#D4AF37]/15 bg-black/50 p-4 text-xs text-[#e8dfd0]`}>
          {JSON.stringify(b.outcome, null, 2)}
        </pre>
      </section>
    </div>
  );
}

function ApprovalExplain(props: { approval: ApprovalPayload["approval"] }) {
  const a = props.approval;
  return (
    <div className={`${autonomyGlassCard} space-y-4 p-6`}>
      <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Queued approval</h2>
      <p className={`text-sm ${autonomyMuted}`}>{a.summary ?? "No summary."}</p>
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className={`text-[11px] uppercase ${autonomyMuted}`}>Domain</dt>
          <dd>{a.domain}</dd>
        </div>
        <div>
          <dt className={`text-[11px] uppercase ${autonomyMuted}`}>Action</dt>
          <dd>{a.actionType}</dd>
        </div>
        <div>
          <dt className={`text-[11px] uppercase ${autonomyMuted}`}>Risk</dt>
          <dd>{a.riskLevel ?? "—"}</dd>
        </div>
      </dl>
      {a.recommendedPayload ?
        <pre className={`mt-2 overflow-auto rounded-xl border border-[#D4AF37]/15 bg-black/50 p-4 text-xs text-[#e8dfd0]`}>
          {JSON.stringify(a.recommendedPayload, null, 2)}
        </pre>
      : null}
    </div>
  );
}
