import type { DreamHomeProfile } from "@/modules/dream-home/types/dream-home.types";
import { DreamHomeTraitCard } from "./DreamHomeTraitCard";
import { DreamHomeInsightCards } from "./DreamHomeInsightCards";

type Props = { profile: DreamHomeProfile };

function toCards(profile: DreamHomeProfile) {
  const out: { title: string; body: string; kind: "tip" | "caution" | "highlight" }[] = [];
  (profile.warnings ?? []).forEach((w) => {
    out.push({ title: "Heads up", body: w, kind: "caution" });
  });
  if (profile.summary) {
    out.push({ title: "Summary", body: profile.summary, kind: "highlight" });
  }
  return out.slice(0, 4);
}

export function DreamHomeProfileView({ profile }: Props) {
  return (
    <div className="mt-6 space-y-6">
      {profile.summary && <p className="text-sm text-slate-200">{profile.summary}</p>}
      <DreamHomeTraitCard label="Your home profile">{profile.householdProfile}</DreamHomeTraitCard>
      <div>
        <h2 className="text-lg font-semibold text-white">Ideal property traits</h2>
        <ul className="mt-2 list-inside list-disc text-slate-300">
          {profile.propertyTraits.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">Neighborhood</h2>
        <ul className="mt-2 list-inside list-disc text-slate-300">
          {profile.neighborhoodTraits.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">Why this fits (from your answers)</h2>
        <ul className="mt-2 list-inside list-disc text-slate-300">
          {profile.rationale.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <DreamHomeInsightCards cards={toCards(profile)} />
    </div>
  );
}
