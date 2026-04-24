import type { DreamHomeInsightCard } from "@/modules/dream-home/types/dream-home.types";

type Props = { cards: DreamHomeInsightCard[] };

const kindBorder: Record<DreamHomeInsightCard["kind"], string> = {
  highlight: "border-premium-gold/40 bg-premium-gold/5",
  tip: "border-white/15 bg-black/20",
  caution: "border-amber-500/30 bg-amber-500/5",
};

export function DreamHomeInsightCards({ cards }: Props) {
  if (!cards.length) {
    return null;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <div key={c.title} className={`rounded-xl border p-4 text-sm ${kindBorder[c.kind]}`}>
          <p className="font-semibold text-white">{c.title}</p>
          <p className="mt-1 text-slate-300">{c.body}</p>
        </div>
      ))}
    </div>
  );
}
