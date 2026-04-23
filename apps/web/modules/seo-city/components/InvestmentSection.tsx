import type { SeoContentBlock } from "../seo-city.types";

type Props = { blocks: SeoContentBlock[] };

export function InvestmentSection({ blocks }: Props) {
  return (
    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-6 sm:p-8">
      {blocks.map((b) => (
        <div key={b.id} className="mb-6 last:mb-0">
          {b.title ? <h2 className="text-xl font-semibold text-amber-950">{b.title}</h2> : null}
          <p className="mt-2 text-amber-950/90 leading-relaxed">{b.body}</p>
          {b.items?.length ? (
            <ul className="mt-3 list-disc pl-5 text-amber-950/90">
              {b.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}
