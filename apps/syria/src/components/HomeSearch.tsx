"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SyriaCitySelect } from "@/components/location/SyriaLocationSelects";

export function HomeSearch() {
  const router = useRouter();
  const t = useTranslations("home");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (city.trim()) params.set("city", city.trim());
    router.push(`/buy?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="darlink-rtl-row flex w-full max-w-3xl flex-col gap-3 rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-4 shadow-[var(--darlink-shadow-sm)] md:flex-row md:items-end"
    >
      <label className="block flex-1 text-sm text-[color:var(--darlink-text-muted)]">
        {t("searchCity")}
        <SyriaCitySelect
          value={city}
          onChange={setCity}
          allLabel={t("searchCityAll")}
          optional
          className="mt-1 min-h-[44px] w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-[color:var(--darlink-text)]"
        />
      </label>
      <label className="block flex-1 text-sm text-[color:var(--darlink-text-muted)]">
        {t("searchKeywords")}
        <Input
          className="mt-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search_placeholder")}
        />
      </label>
      <Button type="submit" variant="primary" className="md:mb-0.5">
        {t("searchSubmit")}
      </Button>
    </form>
  );
}
