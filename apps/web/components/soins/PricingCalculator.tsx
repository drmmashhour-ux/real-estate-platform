"use client";

import { useMemo } from "react";
import type { CareLevel, CareFoodPlanTier } from "@prisma/client";

import { calculateMonthlyCost } from "@/modules/soins/soins-pricing.service";
import type { CareService } from "@prisma/client";

/** UI-friendly slice of residence services for the calculator */
export function PricingCalculator(props: {
  basePrice: number;
  careLevel: CareLevel;
  onCareLevelChange?: (l: CareLevel) => void;
  foodPlans: Array<{ id: string; name: CareFoodPlanTier; mealsPerDay: number; price: number }>;
  selectedFoodPlanId: string | null;
  onFoodPlanChange?: (id: string | null) => void;
  services: Pick<CareService, "id" | "name" | "price" | "requiredLevel">[];
  selectedServiceIds: Set<string>;
  onServiceToggle?: (id: string, on: boolean) => void;
  currency?: string;
}) {
  const cur = props.currency ?? "CAD";

  const pricing = useMemo(() => {
    const selected = props.services.filter((s) => props.selectedServiceIds.has(s.id));
    const fp = props.foodPlans.find((p) => p.id === props.selectedFoodPlanId) ?? null;
    return calculateMonthlyCost({
      basePrice: props.basePrice,
      careLevel: props.careLevel,
      foodPlan: fp,
      services: selected,
    });
  }, [
    props.basePrice,
    props.careLevel,
    props.foodPlans,
    props.selectedFoodPlanId,
    props.services,
    props.selectedServiceIds,
  ]);

  const careLevels: CareLevel[] = ["INDEPENDENT", "ASSISTED", "MEMORY_CARE", "SKILLED"];

  return (
    <div className="rounded-3xl border border-[#D4AF37]/20 bg-[#0A0A0A] p-6">
      <h3 className="text-xl font-semibold text-[#D4AF37]">Estimation mensuelle</h3>
      <p className="mt-2 text-sm text-white/50">
        Indicatif — confirmation avec l’établissement.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70">Niveau de soins</label>
          <select
            className="mt-2 w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-[17px] text-white"
            value={props.careLevel}
            onChange={(e) => props.onCareLevelChange?.(e.target.value as CareLevel)}
          >
            {careLevels.map((l) => (
              <option key={l} value={l}>
                {l.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70">Repas</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {props.foodPlans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => props.onFoodPlanChange?.(p.id)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  props.selectedFoodPlanId === p.id
                    ? "bg-[#D4AF37] text-black"
                    : "border border-white/15 bg-black text-white/85 hover:border-[#D4AF37]/40"
                }`}
              >
                {p.name.replace(/_/g, " ")} · {p.mealsPerDay}/j
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-white/70">Services sélectionnés</p>
          <ul className="mt-2 space-y-2">
            {props.services.map((s) => (
              <li key={s.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 py-2 hover:border-[#D4AF37]/30">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[#D4AF37]"
                    checked={props.selectedServiceIds.has(s.id)}
                    onChange={(e) => props.onServiceToggle?.(s.id, e.target.checked)}
                  />
                  <span className="flex-1 text-[17px] text-white/90">{s.name}</span>
                  <span className="text-sm text-white/45">
                    {s.price.toLocaleString(undefined, { style: "currency", currency: cur })}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ul className="space-y-2 text-sm text-white/65">
          {pricing.breakdown.map((row) => (
            <li key={row.label} className="flex justify-between gap-4">
              <span>{row.label}</span>
              <span>
                {row.amount.toLocaleString(undefined, { style: "currency", currency: cur })}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-[#D4AF37]/20 pt-4">
          <span className="text-lg font-medium text-white">Total estimé</span>
          <span className="text-2xl font-semibold text-[#D4AF37]">
            {pricing.totalMonthly.toLocaleString(undefined, { style: "currency", currency: cur })}
          </span>
        </div>
      </div>
    </div>
  );
}
