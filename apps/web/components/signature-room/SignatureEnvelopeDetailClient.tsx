"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LecipmEsignatureDisclaimer } from "./LecipmEsignatureDisclaimer";

type EnvelopePayload = {
  id: string;
  title: string;
  status: string;
  dealId: string;
  sourceDocumentId: string;
  sourceDocumentKind: string;
  documentHashSha256: string | null;
  canonicalPdfUrl: string | null;
  finalPdfUrl: string | null;
  auditTrailPdfUrl: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  completedAt: string | null;
  participants: Array<{
    id: string;
    displayName: string;
    email: string;
    signerRole: string;
    routingOrder: number;
    status: string;
    signedAt: string | null;
    consentAcceptedAt: string | null;
    requiresOtp: boolean;
  }>;
  events: Array<{
    id: string;
    eventType: string;
    createdAt: string;
    actorEmail: string | null;
    documentHashSha256: string | null;
  }>;
  versions: Array<{
    id: string;
    versionKind: string;
    documentHashSha256: string;
    pdfUrl: string | null;
    immutable: boolean;
    createdAt: string;
  }>;
};

export function SignatureEnvelopeDetailClient({ envelopeId }: { envelopeId: string }) {
  const [data, setData] = useState<{ envelope: EnvelopePayload } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch(`/api/signature/envelopes/${envelopeId}`);
    const json = await res.json();
    if (!res.ok) {
      setErr(json.error ?? "Failed to load");
      setData(null);
      return;
    }
    setData(json);
  }, [envelopeId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return (
      <div className="p-6">
        <p className="text-red-400">{err}</p>
        <Link href="/dashboard/signature" className="mt-4 inline-block text-amber-400">
          ← Back
        </Link>
      </div>
    );
  }

  if (!data?.envelope) {
    return <div className="p-6 text-zinc-500">Loading…</div>;
  }

  const e = data.envelope;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/signature" className="text-xs text-amber-400 hover:text-amber-300">
            ← All envelopes
          </Link>
          <h1 className="mt-2 font-serif text-2xl text-zinc-100">{e.title}</h1>
          <p className="mt-1 text-zinc-400">
            Status: <span className="text-zinc-200">{e.status}</span> · Document {e.sourceDocumentKind}:{" "}
            <span className="font-mono text-xs">{e.sourceDocumentId.slice(0, 12)}…</span>
          </p>
        </div>
        <div className="text-xs text-zinc-500">
          {e.documentHashSha256 ?
            <span className="font-mono">sha256:{e.documentHashSha256}</span>
          : "Hash pending until send / lock"}
        </div>
      </div>

      <LecipmEsignatureDisclaimer />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="font-medium text-zinc-200">Signer progress</h2>
          <ol className="mt-3 space-y-2">
            {e.participants
              .slice()
              .sort((a, b) => a.routingOrder - b.routingOrder)
              .map((p) => (
                <li key={p.id} className="rounded-lg border border-zinc-800/80 bg-black/30 px-3 py-2 text-xs">
                  <span className="text-zinc-500">#{p.routingOrder}</span>{" "}
                  <span className="text-zinc-200">{p.displayName}</span>{" "}
                  <span className="text-zinc-500">({p.signerRole})</span>
                  <div className="mt-1 text-zinc-400">
                    {p.status} · {p.email}
                    {p.requiresOtp ? " · OTP required" : ""}
                    {p.signedAt ? ` · signed ${p.signedAt.slice(0, 19)}` : ""}
                  </div>
                </li>
              ))}
          </ol>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="font-medium text-zinc-200">Signed document versions</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {e.versions.length === 0 ? <li className="text-zinc-500">None yet.</li> : null}
            {e.versions.map((v) => (
              <li key={v.id} className="rounded border border-zinc-800/80 px-2 py-1.5 font-mono text-[11px] text-zinc-400">
                {v.versionKind} · {v.documentHashSha256.slice(0, 16)}… · immutable={String(v.immutable)}
                {v.pdfUrl ?
                  <a href={v.pdfUrl} className="ml-2 text-amber-400" target="_blank" rel="noreferrer">
                    PDF
                  </a>
                : null}
              </li>
            ))}
          </ul>
          {e.finalPdfUrl || e.canonicalPdfUrl ?
            <p className="mt-3 text-xs text-zinc-500">
              View:{" "}
              <a href={e.finalPdfUrl ?? e.canonicalPdfUrl!} className="text-amber-400" target="_blank" rel="noreferrer">
                Final / canonical PDF
              </a>
            </p>
          : null}
        </section>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <h2 className="font-medium text-zinc-200">Audit trail (SignatureEvent)</h2>
        <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto font-mono text-[11px] text-zinc-400">
          {e.events.map((ev) => (
            <li key={ev.id}>
              {ev.createdAt.slice(0, 19)} · {ev.eventType}
              {ev.actorEmail ? ` · ${ev.actorEmail}` : ""}
              {ev.documentHashSha256 ? ` · hash ${ev.documentHashSha256.slice(0, 10)}…` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
