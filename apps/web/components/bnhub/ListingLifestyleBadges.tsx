import { Baby, Dog, Home, Music, Waves } from "lucide-react";

type Props = {
  noiseLevel?: string | null;
  familyFriendly?: boolean;
  petsAllowed?: boolean;
  allowedPetTypes?: unknown;
  maxPetWeightKg?: number | null;
  petRules?: string | null;
  experienceTags?: unknown;
  servicesOffered?: unknown;
};

function tags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").map((s) => s.toLowerCase());
}

export function ListingLifestyleBadges({
  noiseLevel,
  familyFriendly,
  petsAllowed,
  allowedPetTypes,
  maxPetWeightKg,
  petRules,
  experienceTags,
  servicesOffered,
}: Props) {
  const exp = tags(experienceTags);
  const svc = tags(servicesOffered);
  const petTypes = tags(allowedPetTypes);

  return (
    <div className="flex flex-wrap gap-2">
      {noiseLevel ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-200">
          <Music className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
          {noiseLevel === "quiet" ? "Quiet area" : noiseLevel === "lively" ? "Lively area" : "Moderate noise"}
        </span>
      ) : null}
      {familyFriendly ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-200">
          <Baby className="h-3.5 w-3.5 text-sky-400" aria-hidden />
          Family-friendly
        </span>
      ) : null}
      {petsAllowed ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/50 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
          <Dog className="h-3.5 w-3.5" aria-hidden />
          Pets: {petTypes.length ? petTypes.join(", ") : "ask host"}
          {maxPetWeightKg != null ? ` · max ${maxPetWeightKg} kg` : ""}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-500">
          No pets
        </span>
      )}
      {exp.includes("waterfront") ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-800/60 bg-cyan-950/30 px-2.5 py-1 text-[11px] text-cyan-200">
          <Waves className="h-3.5 w-3.5" aria-hidden />
          Waterfront
        </span>
      ) : null}
      {exp.includes("downtown") ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-200">
          <Home className="h-3.5 w-3.5 text-amber-400" aria-hidden />
          Downtown
        </span>
      ) : null}
      {exp.includes("near_attractions") ? (
        <span className="rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-200">
          Near attractions
        </span>
      ) : null}
      {svc.includes("airport_pickup") ? (
        <span className="rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-200">
          Airport pickup (ask host)
        </span>
      ) : null}
      {svc.includes("parking") ? (
        <span className="rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-200">
          Parking
        </span>
      ) : null}
      {svc.includes("shuttle") ? (
        <span className="rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-200">
          Shuttle
        </span>
      ) : null}
      {petRules?.trim() ? (
        <p className="w-full text-xs text-slate-500">
          <span className="font-medium text-slate-400">Pet rules:</span> {petRules.slice(0, 280)}
          {petRules.length > 280 ? "…" : ""}
        </p>
      ) : null}
    </div>
  );
}
