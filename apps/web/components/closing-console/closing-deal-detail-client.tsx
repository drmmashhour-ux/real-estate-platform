"use client";

import * as React from "react";
import { CloseProbabilityGauge } from "@/components/deals/CloseProbabilityGauge";

type ClosingDetail = {
  deal: {
    id: string;
    dealCode: string | null;
    status: string;
    listingId: string | null;
    lecipmExecutionPipelineState: string | null;
  } | null;
  closing: {
    id: string;
    status: string;
    readinessStatus: string | null;
    closingDate: string | null;
    notes: string | null;
  } | null;
  documents: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    required: boolean;
    fileUrl: string | null;
    notes: string | null;
  }>;
  checklist: Array<{
    id: string;
    title: string;
    category: string;
    priority: string | null;
    status: string;
    notes: string | null;
  }>;
  signatures: Array<{
    id: string;
    signerName: string;
    signerRole: string;
    required?: boolean;
    status: string;
    signedAt: string | null;
    documentId: string | null;
  }>;
  readiness: {
    readinessStatus: string;
    blockers: string[];
    nextSteps: string[];
  };
  latestCloseProbability: {
    id: string;
    probability: number;
    category: string;
    drivers: string[];
    risks: string[];
    createdAt: string;
  } | null;
};

export function ClosingDealDetailClient({ dealId }: { dealId: string }) {
  const [detail, setDetail] = React.useState<ClosingDetail | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [uploadUrls, setUploadUrls] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setMsg(null);
    try {
      const res = await fetch(`/api/closing/deals/${dealId}`, { credentials: "include" });
      const j = (await res.json()) as ClosingDetail & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setDetail(j);
    } catch {
      setMsg("Failed to load closing workspace.");
    }
  }, [dealId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function startClosing() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/closing/deals/${dealId}/start`, {
        method: "POST",
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Start failed");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Start failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmClosing() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/closing/deals/${dealId}/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingDate: new Date().toISOString().slice(0, 10) }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Confirm failed");
      setMsg(`Closing confirmed. Post-close asset: ${j.assetId ?? "—"}`);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Confirm failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadDoc(docId: string) {
    const fileUrl = (uploadUrls[docId] ?? "").trim();
    if (!fileUrl) {
      setMsg("Enter a secure file URL or storage reference before upload.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/closing/deals/${dealId}/documents`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId, fileUrl }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Upload failed");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function verifyDoc(docId: string, status: "VERIFIED" | "REJECTED") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/closing/deals/${dealId}/documents/${docId}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Update failed");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function updateChecklist(itemId: string, status: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/closing/deals/${dealId}/checklist/${itemId}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Update failed");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function refreshCloseProbability() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/close-probability`, {
        method: "POST",
        credentials: "include",
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Close probability failed");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Close probability failed");
    } finally {
      setBusy(false);
    }
  }

  async function updateSignature(signatureId: string, status: "SIGNED" | "DECLINED" | "PENDING") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/closing/deals/${dealId}/signatures`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureId, status }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Update failed");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const ready = detail?.readiness?.readinessStatus === "READY";
  const closing = detail?.closing;
  const pipeline = detail?.deal?.lecipmExecutionPipelineState ?? "—";

  return (
    <div className="space-y-10">
      {msg ?
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{msg}</p>
      : null}

      {/* A) Closing summary */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Closing summary</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Deal status</dt>
            <dd className="font-medium">{detail?.deal?.status ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Execution pipeline</dt>
            <dd className="font-medium">{pipeline}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Closing session</dt>
            <dd className="font-medium">{closing?.status ?? "Not started"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Readiness</dt>
            <dd className="font-medium">{closing?.readinessStatus ?? detail?.readiness?.readinessStatus ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Closing date</dt>
            <dd className="font-medium">
              {closing?.closingDate ? new Date(closing.closingDate).toLocaleDateString() : "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
            onClick={() => void startClosing()}
          >
            Start closing room
          </button>
          <button
            type="button"
            disabled={busy || !ready}
            className="rounded-md border border-green-700 px-3 py-2 text-sm text-green-800 disabled:opacity-50"
            onClick={() => void confirmClosing()}
            title={!ready ? "Complete documents, checklist, and signatures first." : undefined}
          >
            Confirm closing
          </button>
        </div>
      </section>

      {!detail ?
        <p className="text-sm text-muted-foreground">Loading…</p>
      : null}

      {/* B) Documents */}
      {detail ?
        <section className="rounded-lg border border-border p-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste an internal storage URL or reference after upload through your secure broker flow — never expose public links.
          </p>
          <ul className="mt-4 space-y-4">
            {detail.documents.map((d) => (
              <li key={d.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-medium">{d.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {d.category} · {d.required ? "Required" : "Optional"} · {d.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => void verifyDoc(d.id, "VERIFIED")}
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded border px-2 py-1 text-xs text-red-700"
                      onClick={() => void verifyDoc(d.id, "REJECTED")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
                {d.fileUrl ?
                  <p className="mt-2 break-all text-xs text-muted-foreground">On file: {d.fileUrl}</p>
                : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Secure file URL / reference"
                    className="min-w-[200px] flex-1 rounded border bg-background px-2 py-1 text-xs"
                    value={uploadUrls[d.id] ?? ""}
                    onChange={(e) => setUploadUrls((s) => ({ ...s, [d.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded bg-muted px-2 py-1 text-xs"
                    onClick={() => void uploadDoc(d.id)}
                  >
                    Register upload
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      : null}

      {/* C) Checklist */}
      {detail ?
        <section className="rounded-lg border border-border p-4">
          <h2 className="text-lg font-semibold">Checklist</h2>
          <ul className="mt-3 space-y-2">
            {detail.checklist.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium">{c.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {c.category} · {c.priority ?? "—"} · {c.status}
                  </span>
                </div>
                <select
                  className="max-w-xs rounded border bg-background px-2 py-1 text-xs"
                  disabled={busy}
                  value={c.status}
                  onChange={(e) => void updateChecklist(c.id, e.target.value)}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETE">COMPLETE</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </li>
            ))}
          </ul>
        </section>
      : null}

      {/* D) Close probability — before signatures */}
      {detail ?
        <section className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Close probability (AI)</h2>
            <button
              type="button"
              disabled={busy}
              className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-50"
              onClick={() => void refreshCloseProbability()}
            >
              Refresh estimate
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Shown before signatures by design — assistive only; not a regulatory or legal prediction.
          </p>
          {detail.latestCloseProbability ?
            <div className="mt-4">
              <CloseProbabilityGauge
                probability={detail.latestCloseProbability.probability}
                category={detail.latestCloseProbability.category}
                drivers={detail.latestCloseProbability.drivers}
                risks={detail.latestCloseProbability.risks}
                emphasizeLow={detail.latestCloseProbability.category === "LOW"}
              />
              <p className="mt-3 text-center text-sm font-medium text-foreground">
                Estimated close probability: {Math.round(detail.latestCloseProbability.probability)}%
              </p>
            </div>
          : <p className="mt-3 text-sm text-muted-foreground">No estimate yet — use Refresh to compute from current deal signals.</p>}
        </section>
      : null}

      {/* E) Signatures */}
      {detail ?
        <section className="rounded-lg border border-border p-4">
          <h2 className="text-lg font-semibold">Signatures</h2>
          <ul className="mt-3 space-y-2">
            {detail.signatures.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium">{s.signerName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {s.signerRole} · {s.required === false ? "Optional · " : ""}
                    {s.status}
                    {s.signedAt ? ` · ${new Date(s.signedAt).toLocaleString()}` : ""}
                  </span>
                </div>
                <select
                  className="max-w-xs rounded border bg-background px-2 py-1 text-xs"
                  disabled={busy}
                  value={s.status}
                  onChange={(e) =>
                    void updateSignature(s.id, e.target.value as "SIGNED" | "DECLINED" | "PENDING")
                  }
                >
                  <option value="PENDING">PENDING</option>
                  <option value="SIGNED">SIGNED</option>
                  <option value="DECLINED">DECLINED</option>
                </select>
              </li>
            ))}
          </ul>
        </section>
      : null}

      {/* F) Readiness */}
      {detail ?
        <section className="rounded-lg border border-border p-4">
          <h2 className="text-lg font-semibold">Readiness</h2>
          <p className="mt-2 text-sm font-medium">
            Status: <span className="text-primary">{detail.readiness.readinessStatus}</span>
          </p>
          {detail.readiness.blockers.length > 0 ?
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Blockers</p>
              <ul className="mt-1 list-inside list-disc text-sm text-red-800">
                {detail.readiness.blockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          : null}
          {detail.readiness.nextSteps.length > 0 ?
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Next steps</p>
              <ul className="mt-1 list-inside list-disc text-sm">
                {detail.readiness.nextSteps.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          : null}
        </section>
      : null}

      {/* G) Confirm repeated for visibility */}
      {detail?.readiness ?
        <section className="rounded-lg border border-dashed border-border p-4">
          <h2 className="text-lg font-semibold">Finalize</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirmation is blocked until readiness is READY (all required documents verified, every checklist row complete,
            all signatures signed, no declines).
          </p>
          <button
            type="button"
            disabled={busy || !ready}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            onClick={() => void confirmClosing()}
          >
            Confirm closing
          </button>
        </section>
      : null}
    </div>
  );
}
