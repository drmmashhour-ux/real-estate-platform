"use client";

import * as React from "react";
import Link from "next/link";

type Eligibility =
  | { ok: true }
  | { ok: false; blockers: string[] };

type PacketDoc = {
  id: string;
  documentType: string;
  documentId: string;
  version: number;
  dealDocumentType: string;
};

type PacketPayload = {
  id: string;
  version: number;
  status: string;
  generatedAt: string;
  approvedAt: string | null;
  releasedAt: string | null;
  documents: PacketDoc[];
  summary: Record<string, unknown> | null;
  htmlBundle: string | null;
};

type GetResponse = {
  ok: boolean;
  eligibility: Eligibility;
  packet: PacketPayload | null;
  error?: string;
};

export function InvestorPacketDashboardClient({ dealId, investorId }: { dealId: string; investorId: string }) {
  const [data, setData] = React.useState<GetResponse | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [attestation, setAttestation] = React.useState("");
  const [confirmDisclosures, setConfirmDisclosures] = React.useState(false);

  const base = `/api/deals/${dealId}/investor-packet/${investorId}`;

  const load = React.useCallback(async () => {
    setErr(null);
    const r = await fetch(base, { credentials: "include" });
    const j = (await r.json()) as GetResponse;
    if (!r.ok) {
      setErr((j as { error?: string }).error ?? "Failed to load");
      setData(null);
      return;
    }
    setData(j);
  }, [base]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setBusy("generate");
    setErr(null);
    try {
      const r = await fetch(`/api/deals/${dealId}/investor-packet/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investorId }),
      });
      const j = await r.json();
      if (!r.ok) {
        if (j.blockers && Array.isArray(j.blockers)) {
          setErr(`${j.error ?? "Blocked"}: ${(j.blockers as string[]).join(" ")}`);
        } else {
          setErr(j.error ?? "Generate failed");
        }
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    const packetId = data?.packet?.id;
    if (!packetId) return;
    setBusy("approve");
    setErr(null);
    try {
      const r = await fetch(`${base}/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packetId,
          attestationText: attestation,
          confirmDisclosuresCorrect: confirmDisclosures,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? "Approve failed");
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function release() {
    const packetId = data?.packet?.id;
    if (!packetId) return;
    setBusy("release");
    setErr(null);
    try {
      const r = await fetch(`${base}/release`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packetId }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? "Release failed");
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function logExport() {
    const packetId = data?.packet?.id;
    if (!packetId) return;
    setBusy("export");
    setErr(null);
    try {
      const r = await fetch(`${base}/export`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packetId }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? "Export log failed");
        return;
      }
    } finally {
      setBusy(null);
    }
  }

  function downloadHtml() {
    const html = data?.packet?.htmlBundle;
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `private-packet-${dealId.slice(0, 8)}-v${data?.packet?.version ?? ""}.html`;
    a.click();
    URL.revokeObjectURL(url);
    void logExport();
  }

  const elig = data?.eligibility;
  const packet = data?.packet;
  const blockers = elig && !elig.ok ? elig.blockers : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Private investor packet</h1>
          <p className="text-muted-foreground font-mono text-xs">
            deal {dealId.slice(0, 10)}… · investor {investorId.slice(0, 10)}…
          </p>
          <p className="text-muted-foreground mt-2 max-w-2xl text-xs">
            Private placement materials only — not a public offering. No automatic delivery; broker must approve before
            release to this investor.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/deals/${dealId}/investors`} className="rounded-md border px-3 py-1.5 text-xs">
            ← Investors
          </Link>
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      {err ? <p className="rounded border border-red-200 bg-red-50 p-3 text-red-800">{err}</p> : null}

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 text-sm font-medium">Compliance eligibility</h2>
        {elig?.ok ?
          <p className="text-xs text-emerald-800">Requirements satisfied for packet preparation.</p>
        : <ul className="list-inside list-disc space-y-1 text-xs text-amber-900">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        }
      </section>

      <section className="flex flex-wrap gap-2 rounded-lg border border-dashed p-4">
        <button
          type="button"
          disabled={busy !== null || !elig?.ok}
          className="rounded-md bg-slate-900 px-3 py-2 text-xs text-white disabled:opacity-50"
          onClick={() => void generate()}
        >
          {busy === "generate" ? "Generating…" : "Generate new packet version"}
        </button>
        {!elig?.ok ?
          <span className="self-center text-xs text-muted-foreground">Resolve blockers before generating.</span>
        : null}
      </section>

      {packet ?
        <section className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Packet v{packet.version}</h2>
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase">{packet.status}</span>
          </div>
          <p className="text-muted-foreground text-xs">
            Generated {new Date(packet.generatedAt).toLocaleString()}
            {packet.approvedAt ? ` · Approved ${new Date(packet.approvedAt).toLocaleString()}` : ""}
            {packet.releasedAt ? ` · Released ${new Date(packet.releasedAt).toLocaleString()}` : ""}
          </p>

          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Documents</h3>
            <ul className="space-y-1 text-xs">
              {packet.documents.map((d) => (
                <li key={d.id}>
                  <span className="font-mono">{d.documentType}</span> · CRM{" "}
                  <span className="text-muted-foreground">{d.dealDocumentType}</span>
                </li>
              ))}
              {packet.documents.length === 0 ?
                <li className="text-muted-foreground">No deal documents linked yet.</li>
              : null}
            </ul>
          </div>

          {packet.summary ?
            <details className="rounded border bg-muted/30 p-3">
              <summary className="cursor-pointer text-xs font-medium">Section summary (JSON)</summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[10px]">
                {JSON.stringify(packet.summary, null, 2)}
              </pre>
            </details>
          : null}

          {packet.htmlBundle ?
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => downloadHtml()}>
                  Download HTML (logs export audit)
                </button>
              </div>
              <iframe
                title="Packet preview"
                className="h-[420px] w-full rounded border bg-white"
                sandbox="allow-same-origin"
                srcDoc={packet.htmlBundle}
              />
            </div>
          : null}

          <div className="border-t pt-4">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Broker approval</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              Confirm disclosures are correct and enter a short attestation (digital sign-on-file). Release stays locked
              until status is APPROVED.
            </p>
            <label className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={confirmDisclosures}
                onChange={(e) => setConfirmDisclosures(e.target.checked)}
                disabled={packet.status === "RELEASED" || packet.status === "APPROVED"}
              />
              <span>I confirm the disclosures in this packet version are correct to the best of my knowledge.</span>
            </label>
            <textarea
              className="mt-2 w-full rounded border bg-background p-2 text-xs"
              rows={3}
              placeholder="Broker attestation (min. 20 characters)…"
              value={attestation}
              onChange={(e) => setAttestation(e.target.value)}
              disabled={packet.status === "RELEASED" || packet.status === "APPROVED"}
            />
            <button
              type="button"
              disabled={
                busy !== null || packet.status === "RELEASED" || packet.status === "APPROVED" || !confirmDisclosures
              }
              className="mt-2 rounded-md border px-3 py-1.5 text-xs disabled:opacity-50"
              onClick={() => void approve()}
            >
              {busy === "approve" ? "Submitting…" : "Submit approval"}
            </button>
          </div>

          <div className="border-t pt-4">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Release control</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              Single-investor release only. No bulk send. Investor gains read access to this version after release.
            </p>
            <button
              type="button"
              disabled={busy !== null || packet.status !== "APPROVED"}
              className="rounded-md bg-amber-700 px-3 py-2 text-xs text-white disabled:opacity-50"
              onClick={() => void release()}
            >
              {busy === "release" ? "Releasing…" : "Release to investor"}
            </button>
            {packet.status === "RELEASED" ?
              <p className="mt-2 text-xs text-emerald-800">This version is released and treated as immutable.</p>
            : null}
          </div>
        </section>
      : <p className="text-muted-foreground text-xs">No packet yet — generate after eligibility passes.</p>}
    </div>
  );
}
