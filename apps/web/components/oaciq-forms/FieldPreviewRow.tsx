"use client";

export function FieldPreviewRow({
  label,
  valueDisplay,
  fieldKey,
  unmapped,
  debug,
  sourcePath,
  confidence,
  issueMessage,
}: {
  label: string;
  valueDisplay: string;
  fieldKey: string;
  unmapped?: boolean;
  debug?: boolean;
  sourcePath?: string;
  confidence?: number;
  issueMessage?: string;
}) {
  return (
    <div className="border-b border-white/5 py-2 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ds-text-secondary">{label}</p>
          <p className={`mt-0.5 text-sm ${unmapped ? "text-amber-200/80 italic" : "text-ds-text"}`}>
            {valueDisplay || "—"}
          </p>
          {issueMessage ? <p className="mt-1 text-xs text-amber-200/90">{issueMessage}</p> : null}
        </div>
        {unmapped ? (
          <span className="shrink-0 rounded bg-amber-950/50 px-1.5 py-0.5 text-[10px] text-amber-100">Unmapped</span>
        ) : null}
      </div>
      {debug ? (
        <p className="mt-1 font-mono text-[10px] text-ds-text-secondary/80">
          {fieldKey} ← {sourcePath ?? "—"} (confidence {confidence?.toFixed?.(2) ?? "—"})
        </p>
      ) : null}
    </div>
  );
}
