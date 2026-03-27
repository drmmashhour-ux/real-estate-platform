type Props = { text: string | null; sectionKey: string | null };

export function SectionExplainPanel({ text, sectionKey }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Section explanation</p>
      <p className="mt-1 text-xs text-slate-400">{sectionKey ? sectionKey.replace(/_/g, " ") : "Select a section"}</p>
      <p className="mt-2 text-xs text-slate-200">{text ?? "Tap a section and click Explain for a short plain-language summary."}</p>
    </div>
  );
}
