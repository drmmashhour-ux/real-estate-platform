"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  SYRIA_LOCATIONS,
  areaDisplayLabel,
  areaStorageValue,
} from "@/data/syriaLocations";
import type { MapPin } from "@/components/map/MapPicker";

/** ORDER SYBNB-86 — Maps bundle deferred until client mount. */
const MapPicker = dynamic(() => import("@/components/map/MapPicker").then((m) => m.MapPicker), {
  ssr: false,
  loading: () => (
    <div className="min-h-[260px] rounded-[var(--darlink-radius-lg)] bg-[color:var(--darlink-surface-muted)]" aria-busy />
  ),
});

const OTHER_VALUE = "__other__";

export function SyriaSellLocationFields() {
  const t = useTranslations("Sell");
  const locale = useLocale();

  const [govEn, setGovEn] = useState(SYRIA_LOCATIONS[0]?.name_en ?? "");
  const govRow = useMemo(() => SYRIA_LOCATIONS.find((g) => g.name_en === govEn), [govEn]);

  const [cityEn, setCityEn] = useState(() => SYRIA_LOCATIONS[0]?.cities[0]?.name_en ?? "");

  const cityObj = useMemo(() => govRow?.cities.find((c) => c.name_en === cityEn), [govRow, cityEn]);

  useEffect(() => {
    if (!govRow?.cities.length) return;
    if (!govRow.cities.some((c) => c.name_en === cityEn)) setCityEn(govRow.cities[0].name_en);
  }, [govRow, cityEn]);
  const areas = cityObj?.areas ?? [];

  const [areaChoice, setAreaChoice] = useState("");
  const [areaOther, setAreaOther] = useState("");
  const [pin, setPin] = useState<MapPin>(null);

  const areaSubmitted =
    areaChoice === OTHER_VALUE ? areaOther.trim() : areaChoice === "" ? "" : areaChoice;

  return (
    <div className="space-y-4 rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)]/40 p-4">
      <p className="text-sm font-medium text-[color:var(--darlink-text)]">{t("locationSectionTitle")}</p>
      <p className="text-xs leading-relaxed text-[color:var(--darlink-text-muted)]">{t("locationSectionHint")}</p>

      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldGovernorate")}
        <select
          value={govEn}
          onChange={(e) => {
            const nextGov = SYRIA_LOCATIONS.find((g) => g.name_en === e.target.value);
            const nextCity = nextGov?.cities[0]?.name_en ?? "";
            setGovEn(e.target.value);
            setCityEn(nextCity);
            setAreaChoice("");
            setAreaOther("");
          }}
          className="mt-1 w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-[color:var(--darlink-text)] outline-none focus:border-[color:var(--darlink-accent)]"
        >
          {SYRIA_LOCATIONS.map((g) => (
            <option key={g.name_en} value={g.name_en}>
              {locale.startsWith("ar") ? g.name_ar : g.name_en}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldCity")}
        <select
          name="city"
          required
          value={cityEn}
          onChange={(e) => {
            setCityEn(e.target.value);
            setAreaChoice("");
            setAreaOther("");
          }}
          className="mt-1 w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-[color:var(--darlink-text)] outline-none focus:border-[color:var(--darlink-accent)]"
        >
          {(govRow?.cities ?? []).map((c) => (
            <option key={c.name_en} value={c.name_en}>
              {locale.startsWith("ar") ? c.name_ar : c.name_en}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        <span>{t("fieldArea")}</span>
        <span className="ms-1 text-xs font-normal text-[color:var(--darlink-text-muted)]">{t("fieldAreaOptional")}</span>
        <select
          value={areaChoice}
          onChange={(e) => setAreaChoice(e.target.value)}
          className="mt-1 w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-[color:var(--darlink-text)] outline-none focus:border-[color:var(--darlink-accent)]"
        >
          <option value="">{t("areaPlaceholder")}</option>
          {areas.map((a) => (
            <option key={areaStorageValue(a)} value={areaStorageValue(a)}>
              {areaDisplayLabel(a, locale)}
            </option>
          ))}
          <option value={OTHER_VALUE}>{t("areaOther")}</option>
        </select>
      </label>

      {areaChoice === OTHER_VALUE ? (
        <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
          {t("fieldAreaOther")}
          <input
            value={areaOther}
            onChange={(e) => setAreaOther(e.target.value)}
            className="mt-1 w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-[color:var(--darlink-text)] outline-none focus:border-[color:var(--darlink-accent)]"
            placeholder={t("placeholderAreaOther")}
          />
        </label>
      ) : null}

      <input type="hidden" name="area" value={areaSubmitted} readOnly />

      <label className="block text-sm font-medium text-[color:var(--darlink-text)]">
        {t("fieldAddressLandmark")}
        <textarea
          name="address_text"
          rows={2}
          className="mt-1 w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-[color:var(--darlink-text)] outline-none focus:border-[color:var(--darlink-accent)]"
          placeholder={t("placeholderAddressLandmark")}
        />
      </label>

      <div>
        <p className="text-sm font-medium text-[color:var(--darlink-text)]">{t("mapPinLabel")}</p>
        <p className="mt-1 text-xs text-[color:var(--darlink-text-muted)]">{t("mapPinHint")}</p>
        <div className="mt-2">
          <MapPicker value={pin} onChange={setPin} height={260} />
        </div>
      </div>

      <input type="hidden" name="latitude" value={pin != null ? String(pin.lat) : ""} readOnly />
      <input type="hidden" name="longitude" value={pin != null ? String(pin.lng) : ""} readOnly />
    </div>
  );
}
