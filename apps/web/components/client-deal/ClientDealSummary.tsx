"use client";

import { useEffect, useState } from "react";
import { ConditionCard } from "@/components/deal-timeline/ConditionCard";
import { DealTimeline } from "@/components/deal-timeline/DealTimeline";

type Condition = { id: string; conditionType: string; status: string; deadline?: string | null };

type SigSummary = {
  sessionId?: string;
  status?: string;
  provider?: string;
  signedCount?: number;
  participantCount?: number;
} | null;

export function ClientDealSummary({ dealId }: { dealId: string }) {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [pipeline, setPipeline] = useState<string | null>(null);
  const [signature, setSignature] = useState<SigSummary>(null);
  const [notaryAt, setNotaryAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}/client/overview`, { credentials: "include" });
        const data = (await res.json()) as {
          pipelineState?: string;
          conditions?: Condition[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Failed");
        setPipeline(data.pipelineState ?? null);
        setConditions(data.conditions ?? []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
      }
    })();
  }, [dealId]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Your deal</h2>
        <p className="mt-1 text-sm text-zinc-400">
          LECIPM coordinates your transaction — official forms and signing may use your broker&apos;s authorized tools.
        </p>
        {pipeline ? (
          <p className="mt-3 font-mono text-xs text-amber-200/90">
            Status: <span className="text-amber-100">{pipeline}</span>
          </p>
        ) : null}
        {err ? <p className="mt-2 text-sm text-amber-400">{err}</p> : null}
      </section>

      {signature ? (
        <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
          <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Signatures</h3>
          <p className="mt-2 font-mono text-xs text-amber-100/90">
            Session: {signature.status ?? "—"} ({signature.signedCount ?? 0}/{signature.participantCount ?? 0} via{" "}
            {signature.provider ?? "—"})
          </p>
        </section>
      ) : null}

      {notaryAt ? (
        <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
          <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Notary appointment</h3>
          <p className="mt-2 text-sm text-zinc-300">{new Date(notaryAt).toLocaleString()}</p>
        </section>
      ) : null}

      <section>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">Conditions</h3>
        <div className="space-y-2">
          {conditions.length === 0 ? (
            <p className="text-sm text-zinc-500">No conditions tracked yet.</p>
          ) : (
            conditions.map((c) => (
              <ConditionCard key={c.id} conditionType={c.conditionType} status={c.status} deadline={c.deadline ?? undefined} />
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">Activity</h3>
        <DealTimeline dealId={dealId} />
      </section>
    </div>
  );
}
