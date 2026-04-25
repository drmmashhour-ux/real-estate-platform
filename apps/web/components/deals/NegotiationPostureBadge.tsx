"use client";

type PostureT = "soft_explore" | "guided_offer_discussion" | "confident_offer_push" | "hold_and_nurture";
type OfferPosture = { style: PostureT; rationale: string[]; warnings: string[] };

const L: Record<OfferPosture["style"], string> = {
  soft_explore: "border-slate-500/50 bg-slate-800/60 text-slate-200",
  guided_offer_discussion: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  confident_offer_push: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  hold_and_nurture: "border-rose-500/40 bg-rose-500/10 text-rose-100",
};

const TITLE: Record<OfferPosture["style"], string> = {
  soft_explore: "Soft explore",
  guided_offer_discussion: "Guided offer discussion",
  confident_offer_push: "Confident (communication only)",
  hold_and_nurture: "Hold & nurture",
};

export function NegotiationPostureBadge({ posture }: { posture: OfferPosture }) {
  return (
    <div className={`inline-flex flex-col rounded-lg border px-2 py-1.5 text-xs ${L[posture.style]}`}>
      <span className="font-medium">{TITLE[posture.style]}</span>
      {posture.warnings.length > 0 ? (
        <ul className="mt-1 list-inside list-disc text-[10px] opacity-90">
          {posture.warnings.map((w) => (
            <li key={w.slice(0, 40)}>{w}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
