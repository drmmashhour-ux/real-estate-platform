"use client";

import * as React from "react";
import { BrokerFollowUpPanel, type FollowUpPanelItem } from "./BrokerFollowUpPanel";
import { BrokerLeadPipeline, type PipelineItem } from "./BrokerLeadPipeline";
import type { BrokerDealSummary } from "@/modules/broker/closing/broker-deal-summary.service";
import type { LeadClosingStage } from "@/modules/broker/closing/broker-closing.types";

type ApiItem = {
  leadId: string;
  name: string;
  score: number;
  closing: {
    stage: LeadClosingStage;
    lastContactAt?: string;
    responseReceived: boolean;
  };
  suggestions: { id: string; type: string; title: string; description: string; urgency: string }[];
  responseSpeed: "fast" | "average" | "slow";
};

export function BrokerClosingSection({ accent = "#10b981" }: { accent?: string }) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<BrokerDealSummary | null>(null);
  const [items, setItems] = React.useState<ApiItem[]>([]);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/broker/closing", { credentials: "same-origin" });
      if (res.status === 404) {
        setSummary(null);
        setItems([]);
        setErr("Closing workspace is not enabled.");
        return;
      }
      const data = (await res.json()) as { summary?: BrokerDealSummary; items?: ApiItem[]; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Failed to load");
        return;
      }
      setSummary(data.summary ?? null);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const patch = React.useCallback(
    async (leadId: string, action: "contacted" | "responded" | "set_stage", stage?: LeadClosingStage) => {
      setBusyId(leadId);
      try {
        const res = await fetch("/api/broker/closing", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, action, stage }),
        });
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          setErr(j.error ?? "Update failed");
          return;
        }
        await load();
      } catch {
        setErr("Network error");
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const pipelineItems: PipelineItem[] = React.useMemo(
    () =>
      items.map((i) => ({
        leadId: i.leadId,
        name: i.name,
        score: i.score,
        stage: i.closing.stage,
        responseSpeed: i.responseSpeed,
        lastContactAt: i.closing.lastContactAt ?? null,
        responseReceived: i.closing.responseReceived,
      })),
    [items],
  );

  const topFollowUps: FollowUpPanelItem[] = React.useMemo(() => {
    const urgencyRank = (u: string) => (u === "high" ? 0 : u === "medium" ? 1 : 2);
    const flat: FollowUpPanelItem[] = [];
    for (const it of items) {
      for (const s of it.suggestions) {
        flat.push({
          ...s,
          urgency: s.urgency as FollowUpPanelItem["urgency"],
          leadId: it.leadId,
          leadName: it.name,
        });
      }
    }
    return flat.sort((a, b) => urgencyRank(a.urgency) - urgencyRank(b.urgency));
  }, [items]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-slate-400">Loading closing workspace…</p>
      </section>
    );
  }

  if (err || !summary) {
    return err ? (
      <section className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-200">{err}</section>
    ) : null;
  }

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Closing</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Lead pipeline & follow-up</h2>
        <p className="mt-1 text-sm text-slate-400">
          Track stages, response cadence, and next actions — drafts stay manual; nothing sends automatically.
        </p>
      </div>

      <BrokerFollowUpPanel items={topFollowUps} accent={accent} />

      <BrokerLeadPipeline
        summary={summary}
        items={pipelineItems}
        busyId={busyId}
        accent={accent}
        onSetStage={(leadId, stage) => void patch(leadId, "set_stage", stage)}
        onContacted={(leadId) => void patch(leadId, "contacted")}
        onResponded={(leadId) => void patch(leadId, "responded")}
      />
    </section>
  );
}
