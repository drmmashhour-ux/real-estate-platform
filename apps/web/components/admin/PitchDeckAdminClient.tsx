"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SlidePreview = {
  id: string;
  order: number;
  type: string;
  title: string;
  content: unknown;
};

export function PitchDeckAdminClient({
  deckId,
  slides,
}: {
  deckId: string | null;
  slides: SlidePreview[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/pitch-deck/generate", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{err}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          Generate deck
        </button>
        {deckId ? (
          <a
            href={`/api/admin/pitch-deck/${deckId}/pptx`}
            className="inline-flex items-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
          >
            Download PPTX
          </a>
        ) : (
          <span className="text-sm text-slate-500">Generate a deck to enable download.</span>
        )}
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Preview</h3>
        {slides.length === 0 ? (
          <p className="text-sm text-slate-500">No deck yet — metrics will populate traction & growth slides.</p>
        ) : (
          <ul className="space-y-3">
            {slides.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300"
              >
                <span className="font-mono text-xs text-violet-400">
                  #{s.order} · {s.type}
                </span>
                <p className="mt-1 font-medium text-white">{s.title}</p>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-slate-950/80 p-2 text-xs text-slate-500">
                  {JSON.stringify(s.content, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
