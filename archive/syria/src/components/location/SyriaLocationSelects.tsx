"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";
import {
  SYRIA_GOVERNORATES,
  SYRIA_LOCATIONS,
  allSyriaCitiesFlat,
} from "@/data/syriaLocations";

type SelectClassName = string | undefined;

export function SyriaGovernorateSelect(props: {
  value: string;
  onChange: (governorateNameEn: string) => void;
  allLabel: string;
  className?: SelectClassName;
}) {
  const { value, onChange, allLabel, className } = props;
  const locale = useLocale();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        "mt-1 min-h-[44px] w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
      }
    >
      <option value="">{allLabel}</option>
      {SYRIA_GOVERNORATES.map((g) => (
        <option key={g.name_en} value={g.name_en}>
          {locale.startsWith("ar") ? g.name_ar : g.name_en}
        </option>
      ))}
    </select>
  );
}

export function SyriaCitySelect(props: {
  value: string;
  onChange: (cityNameEn: string) => void;
  /** When set, only cities within this governorate (`name_en`) appear. */
  governorateFilterEn?: string | null;
  allLabel: string;
  optional?: boolean;
  className?: SelectClassName;
}) {
  const { value, onChange, governorateFilterEn, allLabel, optional = true, className } = props;
  const locale = useLocale();

  const cities = useMemo(() => {
    if (!governorateFilterEn) return allSyriaCitiesFlat();
    const g = SYRIA_LOCATIONS.find((row) => row.name_en === governorateFilterEn);
    return g?.cities ?? allSyriaCitiesFlat();
  }, [governorateFilterEn]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        "mt-1 min-h-[44px] w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
      }
    >
      {optional ? <option value="">{allLabel}</option> : null}
      {cities.map((c) => (
        <option key={c.name_en} value={c.name_en}>
          {locale.startsWith("ar") ? c.name_ar : c.name_en}
        </option>
      ))}
    </select>
  );
}
