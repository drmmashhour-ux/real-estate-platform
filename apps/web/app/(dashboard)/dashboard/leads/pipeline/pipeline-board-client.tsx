"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SALES_PIPELINE_STAGES,
  STAGE_COLUMN_LABEL,
  normalizePipelineStage,
} from "@/lib/leads/pipeline-stage";
import { getNextBestAction } from "@/lib/leads/next-action";

const GOLD = "var(--color-premium-gold)";
const BG = "#0B0B0B";
const CARD = "#121212";

type LeadCard = {
  id: string;
  name: string;
  score: number;
  pipelineStatus?: string;
  dealValue?: number | null;
  commissionEstimate?: number | null;
  nextFollowUpAt?: string | null;
  lastContactedAt?: string | null;
  meetingAt?: string | null;
  leadSource?: string | null;
  temperature?: string;
};

function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${n.toLocaleString()}`;
}

function bandClass(score: number, temperature?: string): string {
  const band = temperature ?? (score >= 80 ? "hot" : score >= 50 ? "warm" : "cold");
  if (band === "hot") return "border-orange-500/40 bg-orange-500/10 text-orange-100";
  if (band === "warm") return "border-premium-gold/35 bg-premium-gold/10 text-premium-gold";
  return "border-white/15 bg-white/[0.04] text-[#B3B3B3]";
}

export function SalesPipelineBoardClient() {
  const [leads, setLeads] = useState<LeadCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads", { credentials: "same-origin" });
      if (res.status === 401) {
        setAuthError(true);
        setLeads([]);
        return;
      }
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(() => {
    const map: Record<string, LeadCard[]> = {};
    for (const s of SALES_PIPELINE_STAGES) map[s] = [];
    for (const l of leads) {
      const col = normalizePipelineStage(l.pipelineStatus);
      if (!map[col]) map[col] = [];
      map[col].push(l);
    }
    return map;
  }, [leads]);

  const moveLead = async (leadId: string, toStage: string) => {
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id: leadId, pipelineStatus: toStage }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Could not move lead");
      return;
    }
    load();
  };

  if (authError) {
    return (
      <main className="min-h-screen px-4 py-12 text-white" style={{ background: BG }}>
        <Link href="/login?next=/dashboard/leads/pipeline" className="font-semibold" style={{ color: GOLD }}>
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white" style={{ background: BG }}>
      <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              Sales
            </p>
            <h1 className="mt-2 text-3xl font-bold">Pipeline board</h1>
            <p className="mt-2 max-w-xl text-sm text-[#B3B3B3]">
              Drag cards between columns. Deal value and commission sync from evaluations (2.5% broker estimate
              by default).
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/leads"
              className="rounded-xl border border-premium-gold/50 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/10"
            >
              ← Table &amp; filters
            </Link>
            <Link href="/dashboard/broker" className="text-sm font-medium text-premium-gold hover:underline">
              Broker home
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-[#737373]">Loading pipeline…</p>
        ) : (
          <div className="mt-8 flex gap-3 overflow-x-auto pb-4">
            {SALES_PIPELINE_STAGES.map((stage) => (
              <section
                key={stage}
                className="min-w-[260px] max-w-[280px] flex-1 rounded-2xl border border-white/10 bg-[#0E0E0E] p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/lead-id") || dragId;
                  if (id) void moveLead(id, stage);
                  setDragId(null);
                }}
              >
                <header className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <h2 className="text-sm font-bold text-white">{STAGE_COLUMN_LABEL[stage] ?? stage}</h2>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-[#737373]">
                    {columns[stage]?.length ?? 0}
                  </span>
                </header>
                <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1">
                  {(columns[stage] ?? []).map((l) => (
                    <article
                      key={l.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/lead-id", l.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(l.id);
                      }}
                      onDragEnd={() => setDragId(null)}
                      className={`cursor-grab rounded-xl border p-3 transition hover:-translate-y-0.5 active:cursor-grabbing ${bandClass(l.score, l.temperature)}`}
                    >
                      <Link href={`/dashboard/leads/${l.id}`} className="block font-semibold text-white hover:text-premium-gold">
                        {l.name}
                      </Link>
                      <p className="mt-1 text-xs text-[#9CA3AF]">
                        Score <span className="font-bold text-premium-gold">{l.score}</span>
                      </p>
                      <p className="mt-1 text-[11px] text-[#737373]">
                        Deal {fmtMoney(l.dealValue)} · Est. comm. {fmtMoney(l.commissionEstimate)}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-premium-gold/90">
                        Next best:{" "}
                        {
                          getNextBestAction({
                            pipelineStatus: l.pipelineStatus,
                            lastContactedAt: l.lastContactedAt,
                            nextFollowUpAt: l.nextFollowUpAt,
                            meetingAt: l.meetingAt,
                            leadSource: l.leadSource,
                          }).label
                        }
                      </p>
                      {l.nextFollowUpAt ? (
                        <p className="mt-1 text-[10px] text-amber-200/90">
                          Next: {new Date(l.nextFollowUpAt).toLocaleString()}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
