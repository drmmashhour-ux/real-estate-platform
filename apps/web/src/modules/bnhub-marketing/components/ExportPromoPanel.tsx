"use client";

import { useState } from "react";
import { m } from "./marketing-ui-classes";

export function ExportPromoPanel({ listingId }: { listingId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWhatsapp = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/bnhub/marketing/export/whatsapp?listingId=${encodeURIComponent(listingId)}`);
      const j = (await r.json()) as { text?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Export failed");
      setText(j.text ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load export");
      setText(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    setError(null);
    window.open(`/api/bnhub/marketing/export/pdf?listingId=${encodeURIComponent(listingId)}`, "_blank");
  };

  const copy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={m.card}>
      <h3 className={m.title}>Export promo pack</h3>
      <p className={m.subtitle}>
        WhatsApp plain text and PDF brochure — content is built from this listing&apos;s saved fields (host/admin only).
      </p>
      {error ? (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200/95" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={m.btnGhost} onClick={loadWhatsapp} disabled={loading}>
          {loading ? "Loading…" : "Load WhatsApp text"}
        </button>
        <button type="button" className={m.btnPrimary} onClick={downloadPdf}>
          Download PDF
        </button>
        {text != null ? (
          <button type="button" className={m.btnGhost} onClick={copy}>
            {copied ? "Copied" : "Copy text"}
          </button>
        ) : null}
      </div>
      {text != null ? (
        <pre className="mt-4 max-h-56 overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 whitespace-pre-wrap">
          {text}
        </pre>
      ) : null}
    </div>
  );
}
