import Link from "next/link";

import type { SeoCityPageModel } from "../seo-city.types";

import { ListingsGrid } from "./ListingsGrid";

type Props = { model: SeoCityPageModel; browseFsboHref: string; bnHubHref: string; cityLabel: string };

export function SeoCityContentSections({ model, browseFsboHref, bnHubHref, cityLabel }: Props) {
  return (
    <div className="mt-10 space-y-10 border-t border-slate-200 pt-10">
      {model.content.map((b) => (
        <section key={b.id} className="max-w-3xl">
          {b.title ? <h2 className="text-2xl font-semibold text-slate-900">{b.title}</h2> : null}
          <p className="mt-3 whitespace-pre-line text-slate-700 leading-relaxed">{b.body}</p>
          {b.items?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-600">
              {b.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {model.listingPreview.length > 0 ? (
        <ListingsGrid
          title={`Recent listings in ${cityLabel} (FSBO sample)`}
          items={model.listingPreview}
          viewAllHref={browseFsboHref}
          viewAllLabel="Browse FSBO in this city"
        />
      ) : null}

      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Related city pages">
        <span className="font-medium text-slate-800">More:</span>
        {model.internalLinks.map((l) => (
          <Link
            key={l.label + l.href}
            href={l.href}
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:border-rose-200 hover:text-rose-700"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
