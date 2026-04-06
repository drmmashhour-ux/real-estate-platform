import type { ReactNode } from "react";

type OverviewCard = {
  title: string;
  primary: ReactNode;
  secondary?: ReactNode;
  meta?: ReactNode[];
};

type Props = {
  heading: string;
  cards: OverviewCard[];
};

export function LegalPacketOverviewSection({ heading, cards }: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-xl font-semibold text-white">{heading}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.map((card, index) => (
          <div key={`${card.title}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{card.title}</p>
            <div className="mt-2 text-lg font-semibold text-white">{card.primary}</div>
            {card.secondary ? <div className="mt-1 text-sm text-slate-400">{card.secondary}</div> : null}
            {card.meta?.length ? (
              <div className="mt-2 space-y-1">
                {card.meta.map((item, metaIndex) => (
                  <div key={metaIndex} className="text-xs text-slate-500">
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
