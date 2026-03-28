export function KeyIssuesChecklist({ items, title = "Key issues" }: { items: string[]; title?: string }) {
  return (
    <section className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-2 space-y-2 text-sm text-slate-300">
        {(items.length ? items : ["No critical issues detected yet."]).slice(0, 6).map((it) => (
          <li key={it} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-premium-gold" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
