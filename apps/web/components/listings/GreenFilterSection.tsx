"use client";

import { useId } from "react";
import type { GreenSearchFilters, GreenRankingSortMode } from "@/modules/green-ai/green-search.types";

type Props = {
  greenFilters: GreenSearchFilters;
  onChange: (next: GreenSearchFilters) => void;
  sortMode: GreenRankingSortMode | null;
  onSortMode: (m: GreenRankingSortMode | null) => void;
  /** When true, show extra label for broker / admin. */
  brokerView?: boolean;
};

/**
 * Public discovery — Québec-inspired green context only. Not Rénoclimat or government labels.
 */
export function GreenFilterSection({ greenFilters, onChange, sortMode, onSortMode, brokerView = false }: Props) {
  const id = useId();
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-left text-sm text-white/90">
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold/90">Green discovery</p>
      <p className="mt-1 text-xs text-white/50">
        Québec-inspired scores for discovery — not official ratings. Eligibility and savings are never guaranteed.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <label
          className="flex cursor-pointer items-center gap-2 text-xs"
          title="Filter to higher modeled LECIPM / Québec-inspired band. Not a government label."
        >
          <input
            type="checkbox"
            checked={Boolean(greenFilters.minimumGreenLabel && greenFilters.minimumGreenLabel === "GREEN")}
            onChange={(e) =>
              onChange({
                ...greenFilters,
                minimumGreenLabel: e.target.checked ? "GREEN" : undefined,
              })
            }
          />
          Green homes
        </label>
        <label
          className="flex cursor-pointer items-center gap-2 text-xs"
          title="Listings with modeled room to improve (score delta or improvement band)."
        >
          <input
            type="checkbox"
            checked={Boolean(greenFilters.hasUpgradePotential)}
            onChange={(e) => onChange({ ...greenFilters, hasUpgradePotential: e.target.checked || undefined })}
          />
          Strong upgrade potential
        </label>
        <label
          className="flex cursor-pointer items-center gap-2 text-xs"
          title="At least one illustrative program match; verify eligibility and amounts with official sources."
        >
          <input
            type="checkbox"
            checked={Boolean(greenFilters.hasPotentialIncentives)}
            onChange={(e) => onChange({ ...greenFilters, hasPotentialIncentives: e.target.checked || undefined })}
          />
          Potential incentive opportunity
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={Boolean(greenFilters.showOnlyEfficientHeating)}
            onChange={(e) => onChange({ ...greenFilters, showOnlyEfficientHeating: e.target.checked || undefined })}
          />
          Efficient heating
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={Boolean(greenFilters.showOnlyHighInsulation)}
            onChange={(e) => onChange({ ...greenFilters, showOnlyHighInsulation: e.target.checked || undefined })}
          />
          Better insulation
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={Boolean(greenFilters.showOnlyHighWindowPerformance)}
            onChange={(e) =>
              onChange({ ...greenFilters, showOnlyHighWindowPerformance: e.target.checked || undefined })
            }
          />
          Better windows
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={Boolean(greenFilters.showSolarOnly)}
            onChange={(e) => onChange({ ...greenFilters, showSolarOnly: e.target.checked || undefined })}
          />
          Solar
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={Boolean(greenFilters.showGreenRoofOnly)}
            onChange={(e) => onChange({ ...greenFilters, showGreenRoofOnly: e.target.checked || undefined })}
          />
          Green roof
        </label>
      </div>
      <div className="mt-3">
        <label className="text-xs text-white/60" htmlFor={`${id}-gsort`}>
          {brokerView ? "Green sort (broker / admin)" : "Green ranking mode (assistive)"}
        </label>
        <select
          id={`${id}-gsort`}
          className="mt-1 w-full max-w-md rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white"
          value={sortMode ?? "default"}
          onChange={(e) => {
            const v = e.target.value;
            onSortMode(v === "default" || v === "" ? null : (v as GreenRankingSortMode));
          }}
        >
          <option value="default">Standard search order</option>
          <option value="green_best_now">Best current modeled green</option>
          <option value="green_upgrade_potential">Upgrade potential</option>
          <option value="green_incentive_opportunity">Illustrative incentive opportunity</option>
          <option value="standard_with_green_boost">Standard + light green nudge</option>
        </select>
      </div>
    </div>
  );
}
