import type { SeoContentBlock } from "../seo-city.types";

type Props = { blocks: SeoContentBlock[] };

export function AreaOverview({ blocks }: Props) {
  return (
    <div className="space-y-8">
      {blocks.map((b) => (
        <section key={b.id} className="prose prose-slate max-w-none">
          {b.title ? <h2 className="text-2xl font-semibold text-slate-900">{b.title}</h2> : null}
          <p className="mt-2 text-slate-700 leading-relaxed whitespace-pre-line">{b.body}</p>
          {b.items?.length ? (
            <ul className="mt-4 list-disc pl-5 text-slate-700">
              {b.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
