"use client";

import type { GlobalSearchFiltersExtended } from "@/components/search/FilterState";
import type { SearchEngineMode } from "@/components/search/FilterState";
import { useSearchEngineContext } from "@/components/search/SearchEngine";

export type QuickChipDef = {
  id: string;
  label: string;
  patch: Partial<GlobalSearchFiltersExtended>;
};

const BUY_DEFS: QuickChipDef[] = [];

const SHORT_DEFS: QuickChipDef[] = [
  { id: "waterfront", label: "Waterfront", patch: { features: ["waterfront"] } },
  { id: "hot_tub", label: "Hot tub", patch: { features: ["hot_tub"] } },
  { id: "pet_friendly", label: "Pet friendly", patch: { features: ["pet_friendly"] } },
  { id: "self_checkin", label: "Self check-in", patch: { features: ["self_checkin"] } },
];

const RENT_DEFS: QuickChipDef[] = [
  { id: "furnished", label: "Furnished", patch: { furnished: "yes" } },
  { id: "utilities", label: "Utilities included", patch: { features: ["utilities included"] } },
  { id: "parking", label: "Parking", patch: { features: ["parking"] } },
  { id: "transit", label: "Near transit", patch: { features: ["transit"] } },
];

function defsForMode(mode: SearchEngineMode): QuickChipDef[] {
  if (mode === "short") return SHORT_DEFS;
  if (mode === "rent") return RENT_DEFS;
  return BUY_DEFS;
}

export function QuickFilterChips({ tone = "gold" }: { tone?: "gold" | "slate" | "hero" }) {
  const { mode, draft, applyPatch } = useSearchEngineContext();

  const defs = defsForMode(mode);
  if (defs.length === 0) return null;

  const isActive = (def: QuickChipDef) => {
    const p = def.patch;
    if (p.priceMin != null && p.priceMin > 0) return draft.priceMin >= p.priceMin;
    if (p.furnished != null) return draft.furnished === p.furnished;
    if (p.features?.length) {
      const f = p.features[0];
      return draft.features.includes(f);
    }
    return false;
  };

  const toggle = (def: QuickChipDef) => {
    const active = isActive(def);
    if (def.patch.furnished != null) {
      applyPatch(active ? { furnished: "any" } : { furnished: def.patch.furnished ?? "yes" });
      return;
    }
    const kw = (def.patch.features ?? [])[0];
    if (!kw) return;
    const nextFeatures = active
      ? draft.features.filter((x) => x !== kw)
      : [...draft.features.filter((x) => x !== kw), kw];
    applyPatch({ features: nextFeatures });
  };

  const gold = "border-white/15 bg-black/30 text-slate-300 hover:border-[#C9A646]/40 hover:text-white";
  const goldOn = "border-[#C9A646]/50 bg-[#C9A646]/15 text-[#E8C547]";
  const slate = "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-emerald-500/40";
  const slateOn = "border-emerald-500/50 bg-emerald-500/10 text-emerald-200";
  const hero = "border-slate-200/80 bg-white/95 text-slate-800 shadow-sm hover:border-slate-300";
  const heroOn = "border-[#C9A646] bg-[#C9A646]/15 text-slate-900";

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {defs.map((def) => {
        const on = isActive(def);
        const cls =
          tone === "slate"
            ? on
              ? slateOn
              : slate
            : tone === "hero"
              ? on
                ? heroOn
                : hero
              : on
                ? goldOn
                : gold;
        return (
          <button
            key={def.id}
            type="button"
            onClick={() => toggle(def)}
            className={["rounded-full border px-3 py-1.5 text-xs font-semibold transition", cls].join(" ")}
          >
            {def.label}
          </button>
        );
      })}
    </div>
  );
}
