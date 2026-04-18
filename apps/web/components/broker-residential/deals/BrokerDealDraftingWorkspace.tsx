"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ApproveSuggestionButton } from "@/components/broker-controls/ApproveSuggestionButton";
import { EditSuggestionModal } from "@/components/broker-controls/EditSuggestionModal";
import { RejectSuggestionButton } from "@/components/broker-controls/RejectSuggestionButton";

type DocRow = { id: string; type: string; workflowStatus: string | null };

type PersistedSugg = {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  severity: string;
  sourceAttribution: Record<string, unknown> | null;
};

type ClauseSuggestion = {
  id: string;
  title: string;
  suggestion: string;
  whyGenerated: string;
  source: {
    source: string;
    page: number | null;
    section: string;
    explanation: string;
  };
  confidence: number;
  severity: string;
  requiresBrokerReview: string;
};

type ComplianceIssue = {
  severity: string;
  title: string;
  summary: string;
};

export function BrokerDealDraftingWorkspace({
  dealId,
  executionHref,
  documents,
}: {
  dealId: string;
  executionHref: string;
  documents: DocRow[];
}) {
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [clauseSuggestions, setClauseSuggestions] = useState<ClauseSuggestion[]>([]);
  const [reviewQueue, setReviewQueue] = useState<PersistedSugg[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [sourcesCatalog, setSourcesCatalog] = useState<{ title: string; referenceLabel: string }[]>([]);
  const [editTarget, setEditTarget] = useState<PersistedSugg | null>(null);

  const removeFromQueue = useCallback((suggestionId: string) => {
    setReviewQueue((prev) => prev.filter((x) => x.id !== suggestionId));
  }, []);

  async function runPack() {
    setLoading(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/drafting/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persist: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setClauseSuggestions(data.clauseSuggestions ?? []);
      setReviewQueue(data.reviewQueueSuggestions ?? []);
      setComplianceIssues((data.compliance?.issues ?? []).slice(0, 20));
      setBanner(data.brokerReviewBanner ?? "Draft – Broker Review Required");
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function loadSources() {
    try {
      const res = await fetch(`/api/deals/${dealId}/drafting/sources`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSourcesCatalog((data.catalog ?? []).map((c: { title: string; referenceLabel: string }) => ({
        title: c.title,
        referenceLabel: c.referenceLabel,
      })));
    } catch {
      setSourcesCatalog([]);
    }
  }

  async function runCheck() {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/drafting/check`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setComplianceIssues((data.issues ?? []).slice(0, 24));
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ds-gold/30 bg-black/40 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ds-gold/90">Document intelligence</p>
        <p className="mt-1 text-sm text-ds-text-secondary">
          AI-assisted drafting with real knowledge grounding — nothing finalizes automatically. Outputs require your review before any filing or
          client reliance.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void runPack()}
            className="rounded-xl bg-ds-gold/90 px-4 py-2 text-xs font-medium text-black hover:bg-ds-gold disabled:opacity-50"
          >
            {loading ? "Working…" : "Generate drafting pack (save to review queue)"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void runCheck()}
            className="rounded-xl border border-ds-border px-4 py-2 text-xs text-ds-gold hover:bg-white/5"
          >
            Run compliance check
          </button>
          <button type="button" onClick={() => void loadSources()} className="rounded-xl border border-ds-border px-4 py-2 text-xs text-ds-text-secondary hover:bg-white/5">
            Load source catalog
          </button>
          <Link href={executionHref} className="rounded-xl border border-ds-border px-4 py-2 text-xs text-ds-text-secondary hover:bg-white/5">
            Full execution workspace
          </Link>
        </div>
        {banner ? <p className="mt-3 text-xs font-medium text-amber-200/90">{banner}</p> : null}
      </div>

      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">1 · Document panel</h3>
        <ul className="mt-3 space-y-2 text-sm text-ds-text-secondary">
          {documents.length === 0 ? <li>No document rows on this deal.</li> : null}
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/5 bg-black/30 px-3 py-2">
              <span>{d.type}</span>
              <span className="text-xs text-ds-gold/80">{d.workflowStatus ?? "—"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">2 · Drafting & clause suggestions</h3>
        <p className="mt-1 text-xs text-ds-text-secondary">Ephemeral previews + persisted queue rows (after “Generate drafting pack”).</p>
        <div className="mt-4 space-y-4">
          {clauseSuggestions.map((s) => (
            <article key={s.id} className="rounded-xl border border-white/10 bg-black/35 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ds-text">{s.title}</p>
                  <p className="mt-2 text-xs text-ds-text-secondary">{s.suggestion}</p>
                  <p className="mt-2 text-xs text-ds-gold/90">Why: {s.whyGenerated}</p>
                </div>
                <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-ds-text-secondary">{(s.confidence * 100).toFixed(0)}% conf.</span>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ds-text-secondary">
                Based on <span className="text-ds-gold/90">{s.source.source}</span>
                {s.source.page != null ? ` (p. ${s.source.page})` : ""} — {s.source.section}. {s.source.explanation}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">{s.requiresBrokerReview}</p>
            </article>
          ))}
          {clauseSuggestions.length === 0 ? <p className="text-sm text-ds-text-secondary">Run the drafting pack to populate suggestions.</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">3 · Review queue (persisted IDs)</h3>
        <p className="mt-1 text-xs text-ds-text-secondary">Approve / reject records your decision — does not auto-apply text to instruments.</p>
        <ul className="mt-4 space-y-4">
          {reviewQueue.map((s) => (
            <li key={s.id} className="rounded-xl border border-ds-gold/20 bg-black/40 p-4">
              <p className="text-sm font-medium text-ds-text">{s.title}</p>
              <p className="mt-2 line-clamp-4 text-xs text-ds-text-secondary">{s.summary}</p>
              {s.sourceAttribution && typeof s.sourceAttribution === "object" ? (
                <p className="mt-2 text-[11px] text-ds-gold/85">
                  Source: {String((s.sourceAttribution as { source?: string }).source ?? "—")}
                  {(s.sourceAttribution as { page?: number }).page != null
                    ? ` · p. ${(s.sourceAttribution as { page?: number }).page}`
                    : ""}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <ApproveSuggestionButton dealId={dealId} suggestionId={s.id} onDone={() => removeFromQueue(s.id)} />
                <RejectSuggestionButton dealId={dealId} suggestionId={s.id} onDone={() => removeFromQueue(s.id)} />
                <button
                  type="button"
                  onClick={() => setEditTarget(s)}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-ds-text-secondary hover:bg-white/5"
                >
                  Edit (audit)
                </button>
              </div>
            </li>
          ))}
          {reviewQueue.length === 0 ? <li className="text-sm text-ds-text-secondary">No persisted rows yet.</li> : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">4 · Risk warnings</h3>
        <ul className="mt-3 space-y-2">
          {complianceIssues.map((issue, i) => (
            <li key={i} className="rounded-lg border border-red-500/25 bg-red-950/30 px-3 py-2 text-sm">
              <span className="text-[10px] font-semibold uppercase text-red-300/90">{issue.severity}</span> {issue.title}
              <p className="text-xs text-ds-text-secondary">{issue.summary}</p>
            </li>
          ))}
          {complianceIssues.length === 0 ? <li className="text-sm text-ds-text-secondary">Run checks to populate warnings.</li> : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">5 · Source references</h3>
        <ul className="mt-3 space-y-2 text-sm text-ds-text-secondary">
          {sourcesCatalog.length === 0 ? <li>Load source catalog — lists registered drafting materials (metadata only).</li> : null}
          {sourcesCatalog.map((c, i) => (
            <li key={i}>
              {c.title} — <span className="text-ds-gold/80">{c.referenceLabel}</span>
            </li>
          ))}
        </ul>
      </section>

      {editTarget ? (
        <EditSuggestionModal
          dealId={dealId}
          suggestionId={editTarget.id}
          title={editTarget.title}
          initialText={editTarget.summary}
          onClose={() => setEditTarget(null)}
          onRecorded={() => setEditTarget(null)}
        />
      ) : null}
    </div>
  );
}
