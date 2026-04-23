"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { SyriaCitySelect } from "@/components/location/SyriaLocationSelects";

type Intent = "buy" | "rent" | "stays";

export function HeroSegmentedSearch() {
  const router = useRouter();
  const t = useTranslations("home");
  const [intent, setIntent] = useState<Intent>("buy");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  function pathForIntent(i: Intent): string {
    if (i === "buy") return "/buy";
    if (i === "rent") return "/rent";
    return "/bnhub/stays";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (city.trim()) params.set("city", city.trim());
    const qs = params.toString();
    router.push(qs ? `${pathForIntent(intent)}?${qs}` : pathForIntent(intent));
  }

  const segments: { id: Intent; label: string }[] = [
    { id: "buy", label: t("heroIntentBuy") },
    { id: "rent", label: t("heroIntentRent") },
    { id: "stays", label: t("heroIntentStays") },
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
            aria-selected={intent === s.id}
            onClick={() => setIntent(s.id)}
            className={cn(
              "flex-1 rounded-[var(--darlink-radius-lg)] px-3 py-2.5 text-sm font-semibold transition",
              intent === s.id ? "bg-white text-[color:var(--darlink-navy)] shadow-sm" : "text-white/90 hover:bg-white/10",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3 rounded-[var(--darlink-radius-2xl)] bg-white p-4 shadow-[var(--darlink-shadow-xl)] ring-1 ring-black/5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[color:var(--darlink-text-muted)]">
            {t("searchCity")}
            <SyriaCitySelect
              value={city}
              onChange={setCity}
              allLabel={t("searchCityAll")}
              optional
              className="mt-1 min-h-[44px] w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-[color:var(--darlink-text)]"
            />
          </label>
          <label className="block text-sm font-medium text-[color:var(--darlink-text-muted)]">
            {t("searchKeywords")}
            <Input
              className="mt-1 border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search_placeholder")}
            />
          </label>
        </div>
        <Button type="submit" variant="primary" className="w-full sm:w-auto">
          {t("searchSubmit")}
        </Button>
      </form>
    </div>
  );
}
