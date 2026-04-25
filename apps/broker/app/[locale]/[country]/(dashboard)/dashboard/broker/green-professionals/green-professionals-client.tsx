"use client";

import { useState } from "react";
import type { MatchedContractor } from "@/modules/contractors/contractor.model";
import { CONTRACTOR_MONETIZATION, CONTRACTOR_WORK_DISCLAIMER } from "@/modules/contractors/contractor.model";

export function GreenProfessionalsClient({
  initialContractors,
  region,
  wantedTags,
}: {
  initialContractors: MatchedContractor[];
  region: string;
  wantedTags: string[];
}) {
  const [status, setStatus] = useState<string | null>(null);

  async function submitQuote(contractorId: string | null, projectDescription: string) {
    setStatus(null);
    const res = await fetch("/api/contractors/quote-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractorId,
        projectDescription,
        upgradeHints: wantedTags,
        region,
      }),
    });
    const json = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
    if (!res.ok) {
      setStatus(json?.error ?? "Could not send request.");
      return;
    }
    setStatus(json?.message ?? "Request sent.");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-500/30 bg-amber-950/25 px-3 py-2 text-xs text-amber-100/90">
        <p className="font-medium text-amber-100">{CONTRACTOR_MONETIZATION.leadFeePerIntroductionCad}</p>
        <p className="mt-1">{CONTRACTOR_MONETIZATION.premiumListingMonthlyCad}</p>
      </div>

      {initialContractors.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm text-slate-400">
          No contractors matched — try <span className="text-slate-300">region=Quebec</span> or add upgrade text to{" "}
          <span className="text-slate-300">actions=</span> in the URL. Parsed tags:{" "}
          {wantedTags.length ? wantedTags.join(", ") : "none"}.
        </p>
      ) : null}

      <ul className="space-y-5">
        {initialContractors.map((c) => (
          <li key={c.id} className="rounded-xl border border-white/10 bg-black/35 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{c.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {c.region} · ★ {c.rating.toFixed(1)}
                  {c.premiumListing ? (
                    <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-100">
                      Premium listing
                    </span>
                  ) : null}
                </p>
                <p className="mt-2 text-xs text-slate-500">{c.matchReasons.join(" · ")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.services.map((s) => (
                    <span key={s} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100">
                      {s.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {c.reviews.length > 0 ? (
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Reviews</p>
                <ul className="mt-2 space-y-2">
                  {c.reviews.slice(0, 3).map((r) => (
                    <li key={r.id} className="text-xs text-slate-400">
                      <span className="text-slate-300">★{r.rating}</span>
                      {r.body ? <> — {r.body}</> : null}
                      {r.authorLabel ? <span className="text-slate-600"> ({r.authorLabel})</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-600">No public reviews yet.</p>
            )}

            <QuoteMiniForm contractorId={c.id} onSubmit={submitQuote} />
          </li>
        ))}
      </ul>

      <GeneralQuoteSection wantedTags={wantedTags} onSubmit={submitQuote} />

      {status ? <p className="text-sm text-emerald-300">{status}</p> : null}

      <p className="text-[11px] leading-relaxed text-slate-500">{CONTRACTOR_WORK_DISCLAIMER}</p>
    </div>
  );
}

function QuoteMiniForm({
  contractorId,
  onSubmit,
}: {
  contractorId: string;
  onSubmit: (contractorId: string | null, description: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSubmit(contractorId, text);
          setText("");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="min-w-0 flex-1">
        <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Request a quote</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe scope, timeline, property address area…"
          rows={2}
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600"
          required
          minLength={8}
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send"}
      </button>
    </form>
  );
}

function GeneralQuoteSection({
  region,
  wantedTags,
  onSubmit,
}: {
  region: string;
  wantedTags: string[];
  onSubmit: (contractorId: string | null, description: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/30 px-4 py-4">
      <p className="text-sm font-medium text-white">Project request (no specific contractor)</p>
      <p className="mt-1 text-xs text-slate-400">We’ll route interest based on your description. {wantedTags.length > 0 ? `Hints: ${wantedTags.join(", ")}` : null}</p>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSubmit(null, text);
            setText("");
          } finally {
            setBusy(false);
          }
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your green upgrade project…"
          rows={3}
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600"
          required
          minLength={8}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/15"
        >
          {busy ? "…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
