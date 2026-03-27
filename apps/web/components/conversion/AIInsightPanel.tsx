export function AIInsightPanel({
  title = "AI insight",
  insights,
}: {
  title?: string;
  insights: string[];
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-slate-300">
        {(insights.length ? insights : ["No AI insight available yet."]).slice(0, 5).map((i) => (
          <li key={i}>- {i}</li>
        ))}
      </ul>
    </section>
  );
}
