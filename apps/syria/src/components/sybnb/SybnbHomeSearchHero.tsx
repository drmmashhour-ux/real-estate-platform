"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { SYRIA_STATE_OPTIONS } from "@/lib/syria/states";

export function SybnbHomeSearchHero() {
  const t = useTranslations("Sybnb.home");
  const locale = useLocale();
  const router = useRouter();
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("category", "stay");
    if (state.trim()) {
      params.set("state", state.trim());
    }
    if (city.trim()) {
      params.set("city", city.trim());
    }
    if (area.trim()) {
      params.set("area", area.trim());
    }
    if (checkIn) {
      params.set("check_in", checkIn);
    }
    if (checkOut) {
      params.set("check_out", checkOut);
    }
    const g = Math.max(1, Math.floor(Number(guests) || 1));
    params.set("guests", String(g));
    router.push(`/sybnb?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black px-4 py-10 text-white shadow-2xl sm:px-8 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(251,191,36,0.18),transparent)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-400/90">{t("kicker")}</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem]">{t("title")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-300 sm:text-base">{t("subtitle")}</p>
      </div>

      <form
        onSubmit={onSearch}
        className="relative mx-auto mt-10 max-w-4xl space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur-sm lg:p-2"
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:gap-2">
          <label className="flex flex-col gap-1 rounded-xl bg-white px-3 py-2 text-left text-neutral-900 lg:col-span-3 [dir=rtl]:text-right">
            <span className="text-[11px] font-medium text-neutral-500">{t("state")}</span>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="min-h-10 w-full cursor-pointer bg-transparent text-sm font-medium outline-none [dir=rtl]:text-right"
            >
              <option value="">{t("stateAll")}</option>
              {SYRIA_STATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {locale === "ar" ? o.labelAr : o.labelEn}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 rounded-xl bg-white px-3 py-2 text-left text-neutral-900 lg:col-span-3 [dir=rtl]:text-right">
            <span className="text-[11px] font-medium text-neutral-500">{t("destination")}</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t("destinationPh")}
              className="min-h-10 w-full bg-transparent text-sm font-medium outline-none placeholder:text-neutral-400 [dir=rtl]:text-right"
            />
          </label>
          <label className="flex flex-col gap-1 rounded-xl bg-white px-3 py-2 text-left text-neutral-900 lg:col-span-3 [dir=rtl]:text-right">
            <span className="text-[11px] font-medium text-neutral-500">{t("areaOptional")}</span>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder={t("areaPh")}
              className="min-h-10 w-full bg-transparent text-sm font-medium outline-none placeholder:text-neutral-400 [dir=rtl]:text-right"
            />
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:gap-2">
          <label className="flex flex-col gap-1 rounded-xl bg-white px-3 py-2 text-left text-neutral-900 lg:col-span-2 [dir=rtl]:text-right">
            <span className="text-[11px] font-medium text-neutral-500">{t("checkIn")}</span>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="min-h-10 w-full bg-transparent text-sm font-medium outline-none [dir=rtl]:text-right"
            />
          </label>
          <label className="flex flex-col gap-1 rounded-xl bg-white px-3 py-2 text-left text-neutral-900 lg:col-span-2 [dir=rtl]:text-right">
            <span className="text-[11px] font-medium text-neutral-500">{t("checkOut")}</span>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="min-h-10 w-full bg-transparent text-sm font-medium outline-none [dir=rtl]:text-right"
            />
          </label>
          <label className="flex flex-col gap-1 rounded-xl bg-white px-3 py-2 text-left text-neutral-900 lg:col-span-2 [dir=rtl]:text-right">
            <span className="text-[11px] font-medium text-neutral-500">{t("guests")}</span>
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="min-h-10 w-full bg-transparent text-sm font-medium outline-none [dir=rtl]:text-right"
            />
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-semibold text-neutral-950 shadow-lg transition hover:from-amber-400 hover:to-amber-500"
            >
              {t("ctaSearch")}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
