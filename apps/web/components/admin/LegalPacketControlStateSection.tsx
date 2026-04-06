import type { ReactNode } from "react";

type ControlCard = {
  items: ReactNode[];
};

type Annotation = {
  label: string;
  body: ReactNode;
};

type Props = {
  heading?: string;
  cards: ControlCard[];
  annotation?: Annotation | null;
};

export function LegalPacketControlStateSection({
  heading = "Control State",
  cards,
  annotation,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-xl font-semibold text-white">{heading}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.map((card, index) => (
          <div key={index} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
            {card.items.map((item, itemIndex) => (
              <p key={itemIndex} className={itemIndex === 0 ? "" : "mt-2"}>
                {item}
              </p>
            ))}
          </div>
        ))}
      </div>
      {annotation ? (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">{annotation.label}</p>
          <div className="mt-2 whitespace-pre-line text-sm text-slate-200">{annotation.body}</div>
        </div>
      ) : null}
    </section>
  );
}
