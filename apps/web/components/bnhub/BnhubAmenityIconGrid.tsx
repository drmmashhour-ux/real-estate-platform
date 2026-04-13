"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bath,
  BedDouble,
  Car,
  Coffee,
  Dumbbell,
  Fan,
  Home,
  Key,
  Laptop,
  Leaf,
  Shield,
  Snowflake,
  Sparkles,
  Sun,
  Trees,
  Tv,
  UtensilsCrossed,
  WashingMachine,
  Waves,
  Wifi,
} from "lucide-react";

function iconForLabel(raw: string): LucideIcon {
  const s = raw.toLowerCase();
  if (s.includes("wifi") || s.includes("internet")) return Wifi;
  if (s.includes("park") || s.includes("garage")) return Car;
  if (s.includes("kitchen") || s.includes("cook")) return UtensilsCrossed;
  if (s.includes("washer") || s.includes("laundry") || s.includes("dryer")) return WashingMachine;
  if (s.includes("tv") || s.includes("cable")) return Tv;
  if (s.includes("air") || s.includes("ac") || s.includes("conditioning")) return Fan;
  if (s.includes("heat")) return Sun;
  if (s.includes("coffee") || s.includes("espresso")) return Coffee;
  if (s.includes("pool") || s.includes("hot tub") || s.includes("spa")) return Waves;
  if (s.includes("gym") || s.includes("fitness")) return Dumbbell;
  if (s.includes("workspace") || s.includes("desk") || s.includes("laptop")) return Laptop;
  if (s.includes("patio") || s.includes("balcony") || s.includes("terrace")) return Trees;
  if (s.includes("fireplace")) return Sparkles;
  if (s.includes("snow") || s.includes("ski")) return Snowflake;
  if (s.includes("safe")) return Shield;
  if (s.includes("bed")) return BedDouble;
  if (s.includes("bath") || s.includes("shower")) return Bath;
  if (s.includes("eco") || s.includes("green")) return Leaf;
  if (s.includes("self") || s.includes("check-in") || s.includes("keyless")) return Key;
  return Home;
}

export function BnhubAmenityIconGrid({
  items,
  normalize,
}: {
  items: string[];
  normalize: (s: string) => string;
}) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((raw, idx) => {
        const label = normalize(raw);
        const Icon = iconForLabel(label);
        return (
          <div
            key={`${idx}-${raw}`}
            className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm"
          >
            <Icon className="h-5 w-5 shrink-0 text-[#006ce4]" aria-hidden />
            <span className="leading-tight">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
