"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { APPRAISAL_SUPPORT_LABELS } from "@/lib/appraisal/compliance-copy";

type CaseListItem = {
  id: string;
  title: string | null;
  reportNumber: string | null;
  subjectListingId: string;
  comparablesReviewed: boolean;
  adjustmentsReviewed: boolean;
  assumptionsReviewed: boolean;
  conclusionReviewed: boolean;
  brokerApproved: boolean;
  valueIndicationCents: number | null;
  finalizedAt: string | null;
  updatedAt: string;
};

type GateInfo = { allowed: boolean; errors: string[] };

function formatMoney(cents: number | null) {
  if (cents == null) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "CAD" }).format(cents / 100);
}

export function AppraisalHubClient() {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingId, setListingId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ case: CaseListItem & { reportDraftJson?: unknown }; gate: GateInfo } | null>(
    null,
  );
  const [assistQ, setAssistQ] = useState("");
  const [assistReply, setAssistReply] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/broker/appraisal-cases");
      const data = (await res.json()) as { cases?: CaseListItem[] };
      if (res.ok) setCases(data.cases ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/broker/appraisal-cases/${id}`);
    const data = (await res.json()) as {
      case?: CaseListItem & { reportDraftJson?: unknown };
      gate?: GateInfo;
      error?: string;
    };
    if (res.ok && data.case && data.gate) {
      setDetail({ case: data.case, gate: data.gate });
    } else {
      setDetail(null);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  const createCase = async () => {
    if (!listingId.trim()) return;
    setBusy("create");
    try {
      const res = await fetch("/api/broker/appraisal-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectListingId: listingId.trim() }),
      });
      if (res.ok) {
        setListingId("");
        await loadList();
      }
    } finally {
      setBusy(null);
    }
  };

  const patchReview = async (patch: Record<string, boolean>) => {
    if (!selectedId) return;
    setBusy("patch");
    try {
      const res = await fetch(`/api/broker/appraisal-cases/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        await loadList();
        await loadDetail(selectedId);
      }
    } finally {
      setBusy(null);
    }
  };

  const runAction = async (path: string, key: string) => {
    if (!selectedId) return;
    setBusy(key);
    try {
      const res = await fetch(`/api/broker/appraisal-cases/${selectedId}${path}`, { method: "POST" });
      if (res.ok) {
        await loadList();
        await loadDetail(selectedId);
      }
    } finally {
      setBusy(null);
    }
  };

  const runAssist = async () => {
    if (!selectedId || !assistQ.trim()) return;
    setBusy("assist");
    try {
      const res = await fetch("/api/broker/appraisal/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: selectedId, question: assistQ.trim() }),
      });
      const data = (await res.json()) as { reply?: string };
      setAssistReply(data.reply ?? null);
    } finally {
      setBusy(null);
    }
  };

  const selected = cases.find((c) => c.id === selectedId);
  const mapHref =
    selectedId && selected
      ? `/dashboard/broker/appraisal/map?listingId=${encodeURIComponent(selected.subjectListingId)}&caseId=${encodeURIComponent(selectedId)}`
      : "/dashboard/broker/appraisal/map";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="rounded-3xl border border-premium-gold/25 bg-[radial-gradient(circle_at_top,#2d2208,transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Broker workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Appraisal Hub</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">{APPRAISAL_SUPPORT_LABELS.productLine}</p>
          <p className="mt-2 max-w-3xl text-xs text-slate-400">{APPRAISAL_SUPPORT_LABELS.disclaimerShort}</p>
          <nav className="mt-6 flex flex-wrap gap-2 text-sm">
            <Link
              href="/dashboard/broker/appraisal/comparative"
              className="rounded-full border border-white/15 px-3 py-1.5 text-slate-200 hover:border-premium-gold/50"
            >
              Comparative Sales
            </Link>
            <Link
              href="/dashboard/broker/appraisal/income"
              className="rounded-full border border-white/15 px-3 py-1.5 text-slate-200 hover:border-premium-gold/50"
            >
              Income Approach
            </Link>
            <Link
              href="/dashboard/broker/appraisal/cost"
              className="rounded-full border border-white/15 px-3 py-1.5 text-slate-200 hover:border-premium-gold/50"
            >
              Cost Approach
            </Link>
            <Link
              href="/dashboard/broker/appraisal/land"
              className="rounded-full border border-white/15 px-3 py-1.5 text-slate-200 hover:border-premium-gold/50"
            >
              Land / Lot
            </Link>
            <Link
              href={mapHref}
              className="rounded-full border border-premium-gold/40 px-3 py-1.5 text-premium-gold hover:bg-premium-gold/10"
            >
              Map & comparables
            </Link>
          </nav>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr,1.2fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold text-white">Cases</h2>
            <p className="mt-2 text-sm text-slate-400">Create a pricing analysis case from a subject FSBO listing id.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-premium-gold/50"
                placeholder="Subject listing id"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
              />
              <button
                type="button"
                disabled={busy === "create" || !listingId.trim()}
                className="rounded-xl bg-premium-gold/90 px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
                onClick={() => void createCase()}
              >
                New case
              </button>
            </div>
            <div className="mt-6 space-y-2">
              {loading ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : cases.length === 0 ? (
                <p className="text-sm text-slate-500">No cases yet.</p>
              ) : (
                cases.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      selectedId === c.id
                        ? "border-premium-gold/50 bg-premium-gold/10"
                        : "border-white/10 bg-black/20 hover:border-white/20"
                    }`}
                  >
                    <p className="font-medium text-white">{c.title ?? "Untitled"}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {c.reportNumber ?? "—"} · market estimate {formatMoney(c.valueIndicationCents)}
                      {c.finalizedAt ? " · finalized" : ""}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            {!selectedId || !detail ? (
              <p className="text-sm text-slate-500">Select a case to run the checklist, compute a market estimate, and draft the report.</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">Active case</h2>
                  <p className="mt-1 text-sm text-slate-400">{detail.case.title}</p>
                  <p className="text-xs text-slate-500">
                    Ref {detail.case.reportNumber} · listing {detail.case.subjectListingId.slice(0, 12)}…
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Broker review gate</p>
                  {detail.gate.allowed ? (
                    <p className="mt-2 text-sm text-emerald-200">All checklist items satisfied — you may finalize.</p>
                  ) : (
                    <ul className="mt-2 list-inside list-disc text-sm text-amber-100/90">
                      {detail.gate.errors.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["comparablesReviewed", "Comparables reviewed", detail.case.comparablesReviewed],
                      ["adjustmentsReviewed", "Adjustments reviewed", detail.case.adjustmentsReviewed],
                      ["assumptionsReviewed", "Assumptions reviewed", detail.case.assumptionsReviewed],
                      ["conclusionReviewed", "Conclusion reviewed", detail.case.conclusionReviewed],
                      ["brokerApproved", "Broker approval", detail.case.brokerApproved],
                    ] as const
                  ).map(([key, label, checked]) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!!busy}
                        onChange={(e) => void patchReview({ [key]: e.target.checked })}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!!busy}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:border-premium-gold/40"
                    onClick={() => void runAction("/compute-value", "compute")}
                  >
                    Compute market estimate
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:border-premium-gold/40"
                    onClick={() => void runAction("/report-draft", "report")}
                  >
                    Generate report draft
                  </button>
                  <button
                    type="button"
                    disabled={!!busy || !detail.gate.allowed}
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
                    onClick={() => void runAction("/finalize", "finalize")}
                  >
                    Finalize packet
                  </button>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Indicative value: <span className="text-white">{formatMoney(detail.case.valueIndicationCents)}</span>
                  </p>
                  {detail.case.reportDraftJson != null ? (
                    <pre className="mt-3 max-h-48 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-slate-400">
                      {JSON.stringify(detail.case.reportDraftJson, null, 2)}
                    </pre>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-sm font-medium text-white">AI appraisal assistant</p>
                  <p className="mt-1 text-xs text-slate-500">Valuation support only — confirms scope and reviewer prompts.</p>
                  <textarea
                    className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-premium-gold/40"
                    rows={3}
                    placeholder="Ask about the report draft, assumptions, or next steps…"
                    value={assistQ}
                    onChange={(e) => setAssistQ(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={busy === "assist" || !assistQ.trim()}
                    className="mt-2 rounded-lg bg-premium-gold/85 px-3 py-1.5 text-xs font-medium text-black disabled:opacity-40"
                    onClick={() => void runAssist()}
                  >
                    Ask
                  </button>
                  {assistReply ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{assistReply}</p>
                  ) : null}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
