export function LegalAssistantSourceChips({ sources }: { sources: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {sources.map((s) => <span key={s} className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-slate-300">{s.replace(/_/g, " ")}</span>)}
    </div>
  );
}
