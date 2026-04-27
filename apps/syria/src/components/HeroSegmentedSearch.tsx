"use client";

import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { SYRIA_STATE_OPTIONS } from "@/lib/syria/states";
import { SYRIA_AMENITIES } from "@/lib/syria/amenities";

type Intent = "buy" | "rent" | "stays";

type Props = {
  /** Short-term stays (BNHub) — hidden in Syria MVP. */
  showStaysTab?: boolean;
};

export function HeroSegmentedSearch({ showStaysTab = true }: Props) {
  const router = useRouter();
  const t = useTranslations("home");
  const locale = useLocale();
  const isAr = locale.startsWith("ar");
  const [intent, setIntent] = useState<Intent>("buy");
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [featureKeys, setFeatureKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!showStaysTab && intent === "stays") setIntent("buy");
  }, [showStaysTab, intent]);

  const effectiveIntent: Intent = !showStaysTab && intent === "stays" ? "buy" : intent;

  function pathForIntent(i: Intent): string {
    if (i === "buy") return "/buy";
    if (i === "rent") return "/rent";
    return "/bnhub/stays";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (state.trim()) params.set("state", state.trim());
    if (city.trim()) params.set("city", city.trim());
    if (featureKeys.length) params.set("features", featureKeys.join(","));
    const qs = params.toString();
    router.push(qs ? `${pathForIntent(effectiveIntent)}?${qs}` : pathForIntent(effectiveIntent));
  }

  const segments: { id: Intent; label: string }[] = showStaysTab
    ? [
        { id: "buy", label: t("heroIntentBuy") },
        { id: "rent", label: t("heroIntentRent") },
        { id: "stays", label: t("heroIntentStays") },
      ]
    : [
        { id: "buy", label: t("heroIntentBuy") },
        { id: "rent", label: t("heroIntentRent") },
      ];

  return (
    <div className="w-full max-w-2xl">
      <div
        className="mb-4 flex rounded-[var(--darlink-radius-xl)] bg-white/10 p-1 ring-1 ring-white/20"
        role="tablist"
        aria-label={t("heroSearchMode")}
      >
        {segments.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={effectiveIntent === s.id}
            onClick={() => setIntent(s.id)}
            className={cn(
              "min-h-11 flex-1 rounded-[var(--darlink-radius-lg)] px-3 py-2.5 text-sm font-semibold",
              effectiveIntent === s.id ? "bg-white text-[color:var(--darlink-navy)]" : "text-white/90 hover:bg-white/10",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <form
        onSubmit={submit}
        className="space-y-3 rounded-[var(--darlink-radius-2xl)] border border-black/5 bg-white p-4 shadow-[var(--darlink-shadow-sm)]"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[color:var(--darlink-text-muted)]">
            {t("searchState")}
            <select
              name="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
            >
              <option value="">{t("searchStateAll")}</option>
              {SYRIA_STATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {isAr ? o.labelAr : o.labelEn}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-[color:var(--darlink-text-muted)]">
            {t("searchCityFree")}
            <Input
              className="mt-1 min-h-[44px] border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)]"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("searchCityPlaceholder")}
              name="city"
            />
          </label>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <p className="text-sm font-medium text-[color:var(--darlink-text-muted)]">{t("searchFeaturesTitle")}</p>
          <div className="grid gap-2 sm:grid-cols-2" dir={isAr ? "rtl" : "ltr"}>
            {SYRIA_AMENITIES.map((a) => {
              const on = featureKeys.includes(a.key);
              return (
                <label
                  key={a.key}
                  className="flex cursor-pointer items-center gap-2 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => {
                      setFeatureKeys((prev) => (on ? prev.filter((k) => k !== a.key) : [...prev, a.key]));
                    }}
                    className="size-4 rounded border-[color:var(--darlink-border)]"
                  />
                  <span className="text-[color:var(--darlink-text)]">{isAr ? a.label_ar : a.label_en}</span>
                </label>
              );
            })}
          </div>
        </div>
        <label className="block text-sm font-medium text-[color:var(--darlink-text-muted)] sm:col-span-2">
          {t("searchKeywords")}
          <Input
            className="mt-1 border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search_placeholder")}
          />
        </label>
        <Button type="submit" variant="primary" className="w-full sm:w-auto">
          {t("searchSubmit")}
        </Button>
      </form>
    </div>
  );
}
