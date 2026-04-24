"use client";

import { useCallback, useEffect, useState } from "react";

type Tab = "brokerage" | "investor" | "awaiting" | "archived";

type Row = {
  id: string;
  kind: string;
  domain: string;
  status: string;
  dealId: string | null;
  capitalDealId: string | null;
  templateKind: string;
  approvedAt: string | null;
  createdAt: string;
};

export function DocumentsDashboardClient() {
  const [tab, setTab] = useState<Tab>("awaiting");
  const [rows, setRows] = useState<Row[]>([]);
  const [detail, setDetail] = useState<{
    id: string;
    renderedHtml: string;
    status: string;
    kind: string;
    domain: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [consentEn, setConsentEn] = useState<string | null>(null);
  const [consentAck, setConsentAck] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tab === "brokerage") params.set("domain", "BROKERAGE");
      if (tab === "investor") params.set("domain", "INVESTMENT");
      if (tab === "awaiting") params.set("group", "awaiting");
      if (tab === "archived") params.set("group", "signed_archived");
      const r = await fetch(`/api/documents?${params.toString()}`, { credentials: "include" });
      const j = (await r.json()) as { items?: Row[]; error?: string };
      if (!r.ok) throw new Error(j.error ?? "List failed");
      setRows(j.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!detail?.id) {
      setConsentEn(null);
      setConsentAck(false);
      return;
    }
    void (async () => {
      const r = await fetch(`/api/documents/${detail.id}/digital-sign`, { credentials: "include" });
      const j = (await r.json()) as { en?: string };
      if (r.ok && j.en) setConsentEn(j.en);
    })();
  }, [detail?.id]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 text-zinc-100">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="max-w-3xl text-sm text-zinc-400">
          Québec brokerage and private-placement assistive documents. Broker approval requires an evidentiary electronic
          signature on the current document hash. Investment outbound may require a second admin compliance record when
          strict mode is on. Not legal advice.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
        {(
          [
            ["brokerage", "Brokerage"],
            ["investor", "Investor"],
            ["awaiting", "Awaiting approval"],
            ["archived", "Signed / archived"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === k ? "bg-amber-500/20 text-amber-200" : "text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}

      <div className="grid gap-6 md:grid-cols-2">
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch(`/api/documents/${r.id}`, { credentials: "include" });
                  const d = await res.json();
                  if (res.ok) {
                    setDetail({
                      id: d.id,
                      renderedHtml: d.renderedHtml,
                      status: d.status,
                      kind: d.kind,
                      domain: d.domain,
                    });
                  }
                }}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-left text-sm hover:border-zinc-600"
              >
                <div className="font-medium text-zinc-200">{r.kind}</div>
                <div className="text-xs text-zinc-500">
                  {r.status} · {r.domain}
                  {r.dealId ? ` · deal ${r.dealId.slice(0, 8)}…` : ""}
                  {r.capitalDealId ? ` · capital ${r.capitalDealId.slice(0, 8)}…` : ""}
                </div>
                <div className="text-xs text-zinc-600">{new Date(r.createdAt).toLocaleString()}</div>
              </button>
            </li>
          ))}
          {!loading && rows.length === 0 ? (
            <li className="text-sm text-zinc-500">No documents in this view.</li>
          ) : null}
        </ul>

        <div className="min-h-[320px] rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          {detail ? (
            <div className="space-y-3">
              <div className="text-sm text-zinc-400">
                {detail.kind} · {detail.domain} · <span className="text-amber-200/90">{detail.status}</span>
              </div>
              <div
                className="prose prose-invert max-h-[480px] max-w-none overflow-auto rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-xs prose-p:my-1 prose-h1:text-base"
                dangerouslySetInnerHTML={{ __html: detail.renderedHtml }}
              />
              {detail.status === "AWAITING_APPROVAL" || detail.status === "DRAFT" ? (
                <div className="space-y-2 rounded-md border border-zinc-700/80 bg-zinc-900/30 p-3 text-xs text-zinc-300">
                  <div className="font-medium text-zinc-200">Electronic signature</div>
                  {consentEn ? <p className="text-zinc-400">{consentEn}</p> : null}
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={consentAck}
                      onChange={(e) => setConsentAck(e.target.checked)}
                      className="mt-1"
                    />
                    <span>I have read the consent line above and agree to sign electronically.</span>
                  </label>
                  <button
                    type="button"
                    className="rounded-md bg-violet-700/50 px-3 py-1.5 text-xs text-violet-100 hover:bg-violet-700/70"
                    onClick={async () => {
                      if (!consentEn || !consentAck) {
                        setError("Confirm consent before signing.");
                        return;
                      }
                      const res = await fetch(`/api/documents/${detail.id}/digital-sign`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          signatureType: "CLICK",
                          consentAcknowledged: true,
                          consentTextQuoted: consentEn,
                        }),
                      });
                      if (!res.ok) {
                        const j = await res.json();
                        setError(j.error ?? "Sign failed");
                        return;
                      }
                      setError(null);
                    }}
                  >
                    Sign (click-to-sign)
                  </button>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <a
                  className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                  href={`/api/documents/${detail.id}/export/signed-pdf`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download signed PDF
                </a>
                <a
                  className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                  href={`/api/documents/${detail.id}/export/audit`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Audit JSON
                </a>
                <button
                  type="button"
                  className="rounded-md bg-emerald-700/40 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-700/60"
                  onClick={async () => {
                    const res = await fetch(`/api/documents/${detail.id}/approve`, {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ brokerConfirmed: true }),
                    });
                    if (!res.ok) {
                      const j = await res.json();
                      setError(j.error ?? "Approve failed");
                      return;
                    }
                    setError(null);
                    await load();
                  }}
                >
                  Approve (broker)
                </button>
                <button
                  type="button"
                  className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
                  onClick={async () => {
                    const res = await fetch(`/api/documents/${detail.id}/investment-compliance`, {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ confirmed: true }),
                    });
                    if (!res.ok) {
                      const j = await res.json();
                      setError(j.error ?? "Compliance step failed");
                      return;
                    }
                    setError(null);
                  }}
                >
                  Record investment compliance (admin)
                </button>
                <button
                  type="button"
                  className="rounded-md bg-sky-800/40 px-3 py-1.5 text-xs text-sky-100 hover:bg-sky-800/60"
                  onClick={async () => {
                    const res = await fetch(`/api/documents/${detail.id}/dispatch`, {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ channel: "SUPPORTING_INTERNAL" }),
                    });
                    if (!res.ok) {
                      const j = await res.json();
                      setError(j.error ?? "Dispatch failed");
                      return;
                    }
                    setError(null);
                    await load();
                  }}
                >
                  Dispatch internal record
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Select a document to preview.</p>
          )}
        </div>
      </div>
    </div>
  );
}
