"use client";

import * as React from "react";
import Link from "next/link";
import { AUTOPILOT_ACTION_PIPELINE_ACK_TEXT } from "@/lib/signature-control/autopilot-broker-ack";

type PipelineRow = {
  id: string;
  type: string;
  status: string;
  aiGenerated: boolean;
  dealId: string | null;
  createdAt: string;
  brokerSignature: { id: string; signedAt: string; documentHash: string } | null;
};

type AuditRow = { id: string; eventKey: string; payload: unknown; actorUserId: string | null; createdAt: string };

export function ActionPipelineDashboardClient({ dealId }: { dealId: string }) {
  const [items, setItems] = React.useState<PipelineRow[]>([]);
  const [selected, setSelected] = React.useState<PipelineRow | null>(null);
  const [detail, setDetail] = React.useState<Record<string, unknown> | null>(null);
  const [audit, setAudit] = React.useState<AuditRow[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [agreementText, setAgreementText] = React.useState("");
  const [agreementConfirmed, setAgreementConfirmed] = React.useState(false);

  const loadList = React.useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/action-pipeline?dealId=${encodeURIComponent(dealId)}`, { credentials: "include" });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error ?? "Failed to load");
      setItems([]);
      return;
    }
    setItems((j.items as PipelineRow[]) ?? []);
  }, [dealId]);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  async function openDetail(row: PipelineRow) {
    setSelected(row);
    setAgreementText("");
    setAgreementConfirmed(false);
    setErr(null);
    const r = await fetch(`/api/action-pipeline/${row.id}`, { credentials: "include" });
    const j = await r.json();
    if (!r.ok) {
      setDetail(null);
      setAudit([]);
      setErr(j.error ?? "Load failed");
      return;
    }
    setDetail(j as Record<string, unknown>);
    const ar = await fetch(`/api/action-pipeline/${row.id}/audit`, { credentials: "include" });
    const aj = await ar.json();
    if (ar.ok) setAudit((aj.items as AuditRow[]) ?? []);
    else setAudit([]);
  }

  async function sign() {
    if (!selected) return;
    setBusy("sign");
    setErr(null);
    try {
      const r = await fetch(`/api/action-pipeline/${selected.id}/sign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementConfirmed, agreementText }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? "Sign failed");
        return;
      }
      await loadList();
      const dr = await fetch(`/api/action-pipeline/${selected.id}`, { credentials: "include" });
      const dj = await dr.json();
      if (dr.ok) {
        setDetail(dj as Record<string, unknown>);
        setSelected({
          id: String(dj.id),
          type: String(dj.type),
          status: String(dj.status),
          aiGenerated: Boolean(dj.aiGenerated),
          dealId: (dj.dealId as string | null) ?? null,
          createdAt: String(dj.createdAt),
          brokerSignature:
            dj.brokerSignature && typeof dj.brokerSignature === "object" ?
              (dj.brokerSignature as PipelineRow["brokerSignature"])
            : null,
        });
      }
      const ar = await fetch(`/api/action-pipeline/${selected.id}/audit`, { credentials: "include" });
      const aj = await ar.json();
      if (ar.ok) setAudit((aj.items as AuditRow[]) ?? []);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">AI autopilot — broker signature gate</h1>
          <p className="text-muted-foreground font-mono text-xs">{dealId}</p>
          <p className="text-muted-foreground mt-2 max-w-2xl text-xs">
            AI prepares operational actions as <strong>READY_FOR_SIGNATURE</strong>. Nothing executes until you review, confirm the
            mandated acknowledgement, and sign. After signature, the platform records execution and runs allowed hooks only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/deals/${dealId}/offer-draft`} className="rounded-md border px-3 py-1.5 text-xs">
            Offer draft
          </Link>
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => void loadList()}>
            Refresh
          </button>
        </div>
      </div>

      {err ? <p className="rounded border border-red-200 bg-red-50 p-3 text-red-800">{err}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border">
          <p className="border-b px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Pending &amp; recent actions</p>
          <ul className="max-h-[420px] divide-y overflow-auto">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-muted/50 ${
                    selected?.id === it.id ? "bg-muted/40" : ""
                  }`}
                  onClick={() => void openDetail(it)}
                >
                  <span className="font-mono text-[10px] text-muted-foreground">{it.id.slice(0, 14)}…</span>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{it.type}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase">{it.status}</span>
                    {it.aiGenerated ?
                      <span className="text-[10px] text-muted-foreground">AI</span>
                    : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {items.length === 0 ?
            <p className="p-3 text-xs text-muted-foreground">No action pipelines for this deal yet.</p>
          : null}
        </div>

        <div className="space-y-3">
          {!selected ?
            <p className="text-xs text-muted-foreground">Select an action to review payload and sign.</p>
          : <div className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Review</p>
                <span className="text-[10px] font-mono text-muted-foreground">{selected.id}</span>
              </div>
              {detail?.status === "READY_FOR_SIGNATURE" ?
                <div className="rounded-md border border-amber-600 bg-amber-50 p-3 text-amber-950">
                  <p className="text-xs font-bold">⚠️ Signature required before execution</p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Read the full payload. Execution hooks (send offer, ledger, closing prep, etc.) run only after you sign.
                  </p>
                </div>
              : null}
              <pre className="max-h-56 overflow-auto rounded border bg-muted/20 p-2 text-[10px] leading-relaxed">
                {JSON.stringify(detail?.dataJson ?? {}, null, 2)}
              </pre>

              {selected.status === "READY_FOR_SIGNATURE" && !selected.brokerSignature ?
                <div className="space-y-2 border-t pt-3">
                  <label className="block space-y-1 text-xs">
                    <span className="font-medium">Type the full acknowledgement (exact match)</span>
                    <textarea
                      className="min-h-[72px] w-full rounded border bg-background p-2 font-mono text-[11px]"
                      value={agreementText}
                      onChange={(e) => setAgreementText(e.target.value)}
                      placeholder={AUTOPILOT_ACTION_PIPELINE_ACK_TEXT}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={agreementConfirmed}
                      onChange={(e) => setAgreementConfirmed(e.target.checked)}
                    />
                    I confirm this matches my professional review as the signing broker.
                  </label>
                  <button
                    type="button"
                    disabled={busy !== null}
                    className="rounded-md bg-slate-900 px-3 py-2 text-xs text-white disabled:opacity-50"
                    onClick={() => void sign()}
                  >
                    {busy === "sign" ? "Signing…" : "Sign digitally & execute"}
                  </button>
                </div>
              : null}

              {audit.length > 0 ?
                <div className="border-t pt-3">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">[signature-control] audit</p>
                  <ul className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                    {audit.map((a) => (
                      <li key={a.id}>
                        <span className="font-mono">{a.createdAt}</span> — {a.eventKey}
                      </li>
                    ))}
                  </ul>
                </div>
              : null}
            </div>
          }
        </div>
      </div>
    </div>
  );
}
