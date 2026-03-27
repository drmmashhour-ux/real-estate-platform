export function SectionExplainDrawer({
  text,
  expectedAnswer,
  example,
  sources,
}: {
  text: string;
  expectedAnswer: string;
  example: string;
  sources?: Array<{ title: string; pageNumber: number | null; importance: string; excerpt: string }>;
}) {
  return (
    <div className="space-y-1 rounded-lg border border-white/10 bg-black/30 p-3 text-xs">
      <p className="text-slate-200">{text}</p>
      <p className="text-slate-400">Expected: {expectedAnswer}</p>
      <p className="text-slate-500">{example}</p>
      {sources?.length ? (
        <div className="mt-2 border-t border-white/10 pt-2">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Sources (uploaded books)</p>
          <ul className="mt-1 space-y-1 text-slate-400">
            {sources.map((s) => (
              <li key={`${s.title}-${s.excerpt.slice(0, 12)}`}>
                {s.title}
                {s.pageNumber != null ? ` · p.${s.pageNumber}` : ""} · {s.importance}
                <span className="block text-slate-500">{s.excerpt}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
