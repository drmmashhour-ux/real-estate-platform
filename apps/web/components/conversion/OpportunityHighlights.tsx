export function OpportunityHighlights({ items, title = "Top opportunities" }: { items: string[]; title?: string }) {
  return (
    <section className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
        {(items.length ? items : ["No standout opportunity yet; run deeper analysis."]).slice(0, 5).map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </section>
  );
}
