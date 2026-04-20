export function AuditPreviewReasoningCard({ text }: { text: string | null | undefined }) {
  if (!text) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-xs text-amber-100/90">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/80">Preview reasoning (safe)</h3>
      <p className="mt-2 text-zinc-300">{text}</p>
    </div>
  );
}
