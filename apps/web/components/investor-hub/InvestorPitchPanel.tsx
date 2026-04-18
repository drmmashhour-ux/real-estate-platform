"use client";

import { useCallback, useMemo, useState } from "react";
import {
  formatPitchAsMarkdown,
  formatPitchAsPlainText,
} from "@/modules/investor/pitch-format";
import type { InvestorReadiness } from "@/modules/investor/pitch.types";

type VariantKey = "short" | "standard" | "long";

const VARIANT_LABEL: Record<VariantKey, string> = {
  short: "Short (~1 min)",
  standard: "Standard",
  long: "Long (~5 min)",
};

function downloadText(filename: string, body: string, mime: string) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function InvestorPitchPanel({
  decks,
  readiness,
  risks,
}: {
  decks: Record<VariantKey, PitchSection[]>;
  readiness: InvestorReadiness;
  risks: string[];
}) {
  const [variant, setVariant] = useState<VariantKey>("standard");

  const sections = decks[variant];

  const fullMd = useMemo(() => formatPitchAsMarkdown(sections), [sections]);
  const fullTxt = useMemo(() => formatPitchAsPlainText(sections), [sections]);

  const copyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullMd);
    } catch {
      window.prompt("Copy markdown:", fullMd);
    }
  }, [fullMd]);

  const readinessClass =
    readiness === "STRONG"
      ? "border-emerald-500/40 text-emerald-200/90"
      : readiness === "MEDIUM"
        ? "border-amber-500/40 text-amber-200/90"
        : "border-zinc-600 text-zinc-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-xl text-amber-100/95">Generated investor pitch</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Live metrics from the investor engine; export for emails, data room, or rehearsal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["short", "standard", "long"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setVariant(k)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                variant === k
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
                  : "border-zinc-700 bg-zinc-950/80 text-zinc-400 hover:border-amber-500/30 hover:text-zinc-200"
              }`}
            >
              {VARIANT_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyAll}
          className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/15"
        >
          Copy full pitch (Markdown)
        </button>
        <button
          type="button"
          onClick={() => downloadText(`lecipm-pitch-${variant}.md`, fullMd, "text/markdown;charset=utf-8")}
          className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-200 hover:border-amber-500/35"
        >
          Download .md
        </button>
        <button
          type="button"
          onClick={() => downloadText(`lecipm-pitch-${variant}.txt`, fullTxt, "text/plain;charset=utf-8")}
          className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-200 hover:border-amber-500/35"
        >
          Download .txt
        </button>
      </div>

      <div
        className={`rounded-xl border px-4 py-3 text-sm ${readinessClass}`}
        role="status"
      >
        <p className="font-semibold">Investor readiness: {readiness}</p>
        {risks.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-xs text-zinc-400">
            {risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-zinc-500">No automated risks flagged — still validate narrative manually.</p>
        )}
      </div>

      <ol className="space-y-6">
        {sections.map((s, i) => (
          <li
            key={s.id}
            className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-zinc-950 to-black p-6 shadow-sm"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-semibold text-amber-600/90">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-serif text-lg text-amber-50/95">{s.title}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{s.content}</p>
            {s.bullets.length > 0 ? (
              <ul className="mt-4 list-inside list-disc space-y-1.5 text-sm text-zinc-400">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
