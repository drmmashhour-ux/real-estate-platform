"use client";

import { useState } from "react";
import { m } from "./marketing-ui-classes";

export function ExportPromoPanel({ listingId }: { listingId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadWhatsapp = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/bnhub/marketing/export/whatsapp?listingId=${encodeURIComponent(listingId)}`);
      const j = (await r.json()) as { text?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setText(j.text ?? "");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
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
      <p className={m.subtitle}>WhatsApp plain text and printable PDF brochure (host/admin only).</p>
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
