"use client";

import { useMemo, useState } from "react";
import type {
  CareFoodPlanTier,
  CareLevel,
  CareResidenceType,
} from "@/types/soins-care-client";

import { PricingCalculator } from "@/components/soins/PricingCalculator";

export type ResidenceDetailVm = {
  id: string;
  title: string;
  city: string;
  address: string;
  type: CareResidenceType;
  basePrice: number;
  description: string | null;
  units: { id: string; title: string; price: number; roomType: string; availability: boolean }[];
  services: { id: string; name: string; type: "MEDICAL" | "DAILY_LIVING" | "SAFETY"; price: number; requiredLevel: CareLevel }[];
  foodPlans: { id: string; name: CareFoodPlanTier; mealsPerDay: number; price: number }[];
};

export function SoinsResidenceDetailClient(props: { vm: ResidenceDetailVm }) {
  const baseFromUnit = useMemo(() => {
    const u = props.vm.units.find((x) => x.availability);
    return u?.price ?? props.vm.basePrice;
  }, [props.vm.units, props.vm.basePrice]);

  const [careLevel, setCareLevel] = useState<CareLevel>("ASSISTED");
  const firstFood = props.vm.foodPlans[0]?.id ?? null;
  const [foodPlanId, setFoodPlanId] = useState<string | null>(firstFood);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const toggle = (id: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:pb-12">
      <header className="border-b border-[#D4AF37]/18 pb-8">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[#D4AF37]/75">Résidence</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-white md:text-4xl">{props.vm.title}</h1>
        <p className="mt-3 text-[17px] text-white/55">
          {props.vm.address}, {props.vm.city}
        </p>
        <p className="mt-4 text-sm uppercase tracking-wide text-white/35">
          {props.vm.type.replace(/_/g, " ")}
        </p>
        {props.vm.description ? (
          <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-white/70">{props.vm.description}</p>
        ) : null}
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold text-[#D4AF37]">Unités</h2>
          <ul className="mt-4 space-y-3">
            {props.vm.units.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0D0D0D] px-4 py-3"
              >
                <div>
                  <p className="text-lg font-medium text-white">{u.title}</p>
                  <p className="text-sm text-white/45">{u.roomType}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#D4AF37]">
                    {u.price.toLocaleString(undefined, { style: "currency", currency: "CAD" })}
                  </p>
                  <p className="text-xs text-white/40">{u.availability ? "Disponible" : "Complet"}</p>
                </div>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-xl font-semibold text-[#D4AF37]">Services</h2>
          <p className="mt-2 text-sm text-white/45">
            Cochez les options pour affiner l’estimation (selon niveau de soins requis).
          </p>
        </section>

        <PricingCalculator
          basePrice={baseFromUnit}
          careLevel={careLevel}
          onCareLevelChange={setCareLevel}
          foodPlans={props.vm.foodPlans}
          selectedFoodPlanId={foodPlanId}
          onFoodPlanChange={setFoodPlanId}
          services={props.vm.services}
          selectedServiceIds={selected}
          onServiceToggle={toggle}
        />
      </div>
    </div>
  );
}
