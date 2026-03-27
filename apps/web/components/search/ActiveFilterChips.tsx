"use client";

import { useMemo } from "react";
import { hasValidMapBounds, type GlobalSearchFiltersExtended } from "@/components/search/FilterState";
import { useSearchEngineContext } from "@/components/search/SearchEngine";

function summarize(f: GlobalSearchFiltersExtended): { key: string; label: string; clear: Partial<GlobalSearchFiltersExtended> }[] {
  const out: { key: string; label: string; clear: Partial<GlobalSearchFiltersExtended> }[] = [];
  if (f.location.trim()) {
    out.push({
      key: "city",
      label: f.location.trim(),
      clear: { location: "" },
    });
  }
  if (f.type === "commercial") {
    out.push({
      key: "mode-commercial",
      label: "Commercial",
      clear: { type: "buy", propertyType: "", propertyTypes: [] },
    });
  }
  if (f.type === "residential") {
    out.push({
      key: "mode-residential",
      label: "Residential",
      clear: { type: "buy", propertyType: "", propertyTypes: [] },
    });
  }
  if (f.type === "new_listing") {
    out.push({
      key: "mode-new-listing",
      label: "New listing",
      clear: { type: "buy", propertyType: "", propertyTypes: [], sort: "recommended" },
    });
  }
  if (f.type === "luxury_properties") {
    out.push({
      key: "mode-luxury",
      label: "Luxury",
      clear: { type: "buy", propertyType: "", propertyTypes: [], priceMin: 0 },
    });
  }
  if (f.type === "new_construction") {
    out.push({
      key: "mode-new-construction",
      label: "New construction",
      clear: { type: "buy", propertyType: "", propertyTypes: [] },
    });
  }
  if (f.type === "sell") {
    out.push({
      key: "mode-sell",
      label: "Sell",
      clear: { type: "buy", propertyType: "", propertyTypes: [] },
    });
  }
  if (f.priceMin > 0 || f.priceMax > 0) {
    const a = f.priceMin > 0 ? `$${f.priceMin.toLocaleString()}` : "";
    const b = f.priceMax > 0 ? `$${f.priceMax.toLocaleString()}` : "";
    out.push({
      key: "price",
      label: [a, b].filter(Boolean).join(" – ") || "Price",
      clear: { priceMin: 0, priceMax: 0 },
    });
  }
  if (f.bedrooms != null) {
    out.push({ key: "bed", label: `${f.bedrooms}+ bd`, clear: { bedrooms: null } });
  }
  if (f.bathrooms != null && f.bathrooms >= 0) {
    out.push({ key: "bath", label: `${f.bathrooms}+ ba`, clear: { bathrooms: null } });
  }
  if ((f.propertyTypes?.length ?? 0) > 0) {
    out.push({
      key: "propertyTypes",
      label: f.propertyTypes!.map((x) => x.replace(/_/g, " ")).join(", "),
      clear: { propertyTypes: [], propertyType: "" },
    });
  } else if (f.propertyType?.trim()) {
    out.push({
      key: "propertyType",
      label: f.propertyType.replace(/_/g, " "),
      clear: { propertyType: "" },
    });
  }
  if (f.minSqft != null && f.minSqft > 0) {
    out.push({ key: "minSqft", label: `${f.minSqft}+ sq ft`, clear: { minSqft: null } });
  }
  if (f.maxSqft != null && f.maxSqft > 0) {
    out.push({ key: "maxSqft", label: `≤ ${f.maxSqft} sq ft`, clear: { maxSqft: null } });
  }
  if (f.yearBuiltMin != null && f.yearBuiltMin > 1700) {
    out.push({ key: "yMin", label: `Built ≥ ${f.yearBuiltMin}`, clear: { yearBuiltMin: null } });
  }
  if (f.yearBuiltMax != null && f.yearBuiltMax > 1700) {
    out.push({ key: "yMax", label: `Built ≤ ${f.yearBuiltMax}`, clear: { yearBuiltMax: null } });
  }
  f.features.forEach((feat, i) => {
    out.push({
      key: `f-${i}-${feat}`,
      label: feat.replace(/_/g, " "),
      clear: { features: f.features.filter((x) => x !== feat) },
    });
  });
  if (f.furnished === "yes" || f.furnished === "no") {
    out.push({
      key: "furnished",
      label: f.furnished === "yes" ? "Furnished" : "Unfurnished",
      clear: { furnished: "any" },
    });
  }
  if (hasValidMapBounds(f)) {
    out.push({
      key: "map",
      label: "Map area",
      clear: { north: null, south: null, east: null, west: null },
    });
  }
  return out;
}

export function ActiveFilterChips({ tone = "default" }: { tone?: "default" | "hero" }) {
  const { draft, applyPatch } = useSearchEngineContext();

  const chips = useMemo(() => summarize(draft), [draft]);

  const remove = (clear: Partial<GlobalSearchFiltersExtended>) => {
    const next: Partial<GlobalSearchFiltersExtended> = { ...clear, page: 1 };
    if (clear.features) {
      next.features = clear.features;
    }
    if (clear.propertyTypes) {
      next.propertyTypes = clear.propertyTypes;
    }
    applyPatch(next);
  };

  if (chips.length === 0) return null;

  const hero = tone === "hero";

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span
        className={[
          "text-[10px] font-semibold uppercase tracking-wide",
          hero ? "text-white/70" : "text-slate-500",
        ].join(" ")}
      >
        Active
      </span>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => remove(c.clear)}
          className={[
            "group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition",
            hero
              ? "border-slate-200/90 bg-white text-slate-900 shadow-sm hover:border-slate-300"
              : "border-white/15 bg-black/40 text-slate-200 hover:border-[#C9A646]/40",
          ].join(" ")}
        >
          <span>{c.label}</span>
          <span
            className={hero ? "text-slate-400 group-hover:text-slate-700" : "text-slate-500 group-hover:text-white"}
            aria-hidden
          >
            ×
          </span>
        </button>
      ))}
    </div>
  );
}
