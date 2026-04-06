"use client";

import type { GlobalSearchFiltersExtended } from "@/components/search/FilterState";
import type { SearchEngineMode } from "@/components/search/FilterState";
import { useSearchEngineContext } from "@/components/search/SearchEngine";

export type QuickChipDef = {
  id: string;
  label: string;
  patch: Partial<GlobalSearchFiltersExtended>;
  /** When set, second click clears back to this snapshot (buy / rent quick chips). */
  clearPatch?: Partial<GlobalSearchFiltersExtended>;
};

const BUY_CLEAR: Partial<GlobalSearchFiltersExtended> = {
  type: "buy",
  propertyTypes: [],
  propertyType: "",
  sort: "recommended",
};

/** One-tap shortcuts on `/listings` — full criteria stay in Filters. */
const BUY_DEFS: QuickChipDef[] = [
  {
    id: "condo",
    label: "Condo",
    patch: { type: "buy", propertyTypes: ["CONDO"], propertyType: "", sort: "recommended" },
    clearPatch: BUY_CLEAR,
  },
  {
    id: "house",
    label: "House",
    patch: { type: "buy", propertyTypes: ["HOUSE"], propertyType: "", sort: "recommended" },
    clearPatch: BUY_CLEAR,
  },
  {
    id: "plex",
    label: "Plex",
    patch: { type: "buy", propertyTypes: ["MULTI_FAMILY"], propertyType: "", sort: "recommended" },
    clearPatch: BUY_CLEAR,
  },
  {
    id: "new_listings",
    label: "New listings",
    patch: { type: "new_listing", sort: "newest", propertyTypes: [], propertyType: "" },
    clearPatch: BUY_CLEAR,
  },
  {
    id: "commercial",
    label: "Commercial",
    patch: { type: "commercial", propertyType: "COMMERCIAL", propertyTypes: [], sort: "recommended" },
    clearPatch: BUY_CLEAR,
  },
];

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
    if (def.clearPatch != null) {
      if (p.type === "new_listing") return draft.type === "new_listing";
      if (p.type === "commercial") return draft.type === "commercial";
      if (p.propertyTypes?.length) {
        const a = [...(draft.propertyTypes ?? [])].sort().join(",");
        const b = [...p.propertyTypes].sort().join(",");
        return draft.type === "buy" && a === b;
      }
    }
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
    if (def.clearPatch != null) {
      applyPatch(active ? def.clearPatch : def.patch);
      return;
    }
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

  const gold = "border-white/15 bg-black/30 text-slate-300 hover:border-premium-gold/40 hover:text-white";
  const goldOn = "border-premium-gold/50 bg-premium-gold/15 text-premium-gold";
  const slate = "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-emerald-500/40";
  const slateOn = "border-emerald-500/50 bg-emerald-500/10 text-emerald-200";
  const hero = "border-slate-200/80 bg-white/95 text-slate-800 shadow-sm hover:border-slate-300";
  const heroOn = "border-premium-gold bg-premium-gold/15 text-slate-900";

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
