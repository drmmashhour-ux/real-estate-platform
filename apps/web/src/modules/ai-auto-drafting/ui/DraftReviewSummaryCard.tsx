export function DraftReviewSummaryCard({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3 text-xs text-slate-300">
      <p className="text-[10px] font-semibold uppercase text-slate-500">Review summary</p>
      <pre className="mt-2 whitespace-pre-wrap font-sans">{text}</pre>
    </div>
  );
}
