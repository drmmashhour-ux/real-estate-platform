"use client";

export function AISuggestionCards({
  items,
}: {
  items: Array<{ title: string; body: string; tone: "positive" | "warning" | "neutral" }>;
}) {
  if (!items.length) return null;
  return (
    <section className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <article
          key={`${item.title}-${item.body}`}
          className={`rounded-lg border p-3 text-sm ${
            item.tone === "positive"
              ? "border-emerald-500/40 bg-emerald-500/10"
              : item.tone === "warning"
                ? "border-rose-500/40 bg-rose-500/10"
                : "border-slate-700 bg-slate-900"
          }`}
        >
          <p className="font-semibold">{item.title}</p>
          <p className="mt-1 text-slate-300">{item.body}</p>
        </article>
      ))}
    </section>
  );
}
