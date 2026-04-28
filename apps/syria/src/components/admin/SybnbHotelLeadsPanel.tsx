"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { SYBNB_HOTEL_LEAD_STATUSES, type SybnbHotelLeadStatusValue } from "@/lib/sybnb/sybnb-hotel-lead-schema";

export type SybnbHotelLeadSerialized = {
  id: string;
  name: string;
  phone: string;
  city: string;
  status: SybnbHotelLeadStatusValue;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export function SybnbHotelLeadsPanel({ initialLeads }: { initialLeads: SybnbHotelLeadSerialized[] }) {
  const t = useTranslations("Admin");
  const [leads, setLeads] = useState(initialLeads);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", phone: "", city: "", notes: "" });

  const statusLabel = useMemo(() => {
    const out: Record<SybnbHotelLeadStatusValue, string> = {} as Record<SybnbHotelLeadStatusValue, string>;
    for (const s of SYBNB_HOTEL_LEAD_STATUSES) {
      out[s] = t(`hotelLeadStatus_${s}`);
    }
    return out;
  }, [t]);

  async function refreshList() {
    const res = await fetch("/api/sybnb/hotels/lead", { credentials: "include" });
    const json = (await res.json()) as { ok?: boolean; leads?: SybnbHotelLeadSerialized[] };
    if (res.ok && json.ok && json.leads) setLeads(json.leads);
  }

  async function patchStatus(id: string, status: SybnbHotelLeadStatusValue) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/sybnb/hotels/lead/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { ok?: boolean; lead?: SybnbHotelLeadSerialized };
      if (!res.ok || !json.ok || !json.lead) {
        setError(t("hotelCrmError"));
        return;
      }
      setLeads((prev) => prev.map((row) => (row.id === id ? json.lead! : row)));
    } finally {
      setBusyId(null);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFormBusy(true);
    try {
      const res = await fetch("/api/sybnb/hotels/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: draft.name.trim(),
          phone: draft.phone.trim(),
          city: draft.city.trim(),
          notes: draft.notes.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; lead?: SybnbHotelLeadSerialized };
      if (!res.ok || !json.ok || !json.lead) {
        setError(t("hotelCrmError"));
        return;
      }
      setDraft({ name: "", phone: "", city: "", notes: "" });
      setLeads((prev) => [json.lead!, ...prev]);
    } finally {
      setFormBusy(false);
    }
  }

  return (
    <div className="space-y-8 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">SYBNB-52</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("hotelCrmTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("hotelCrmSubtitle")}</p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("hotelCrmAddSection")}</h2>
        <form onSubmit={onCreate} className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm font-medium text-stone-700">
            {t("hotelCrmFieldName")} <span className="text-red-600">*</span>
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
              autoComplete="organization"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            {t("hotelCrmFieldPhone")} <span className="text-red-600">*</span>
            <input
              required
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            {t("hotelCrmFieldCity")} <span className="text-red-600">*</span>
            <input
              required
              value={draft.city}
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700 md:col-span-2 lg:col-span-1">
            {t("hotelCrmFieldNotes")}
            <input
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
              placeholder={t("hotelCrmNotesPlaceholder")}
            />
          </label>
          <div className="flex items-end md:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={formBusy}
              className="rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
            >
              {formBusy ? t("hotelCrmSaving") : t("hotelCrmCreate")}
            </button>
            <button
              type="button"
              className="ms-3 text-sm font-semibold text-stone-600 underline"
              onClick={() => void refreshList()}
            >
              {t("hotelCrmRefresh")}
            </button>
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="min-w-[920px] w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left [dir=rtl]:text-right">
              <th className="px-3 py-3 font-semibold text-stone-800">{t("hotelCrmColName")}</th>
              <th className="px-3 py-3 font-semibold text-stone-800">{t("hotelCrmColCity")}</th>
              <th className="px-3 py-3 font-semibold text-stone-800">{t("hotelCrmColPhone")}</th>
              <th className="px-3 py-3 font-semibold text-stone-800">{t("hotelCrmColStatus")}</th>
              <th className="min-w-[280px] px-3 py-3 font-semibold text-stone-800">{t("hotelCrmQuickStatus")}</th>
              <th className="px-3 py-3 font-semibold text-stone-800">{t("hotelCrmColNotes")}</th>
              <th className="px-3 py-3 font-semibold text-stone-800">{t("hotelCrmColUpdated")}</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-stone-600">
                  {t("hotelCrmEmpty")}
                </td>
              </tr>
            ) : (
              leads.map((row) => (
                <tr key={row.id} className="border-b border-stone-100 align-top">
                  <td className="px-3 py-3 font-medium text-stone-900">{row.name}</td>
                  <td className="px-3 py-3 text-stone-800">{row.city}</td>
                  <td className="px-3 py-3 tabular-nums text-stone-800">{row.phone}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex rounded-full bg-amber-100/90 px-2.5 py-0.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-300/60">
                      {statusLabel[row.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {SYBNB_HOTEL_LEAD_STATUSES.map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={busyId === row.id || row.status === st}
                          onClick={() => void patchStatus(row.id, st)}
                          className={cn(
                            "rounded-lg border px-2 py-1 text-[11px] font-semibold transition",
                            row.status === st ?
                              "border-amber-600 bg-amber-600 text-white"
                            : "border-stone-300 bg-white text-stone-800 hover:border-amber-400",
                            busyId === row.id && "opacity-50",
                          )}
                        >
                          {statusLabel[st]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-[200px] px-3 py-3 text-xs text-stone-600 whitespace-pre-wrap">{row.notes ?? "—"}</td>
                  <td className="px-3 py-3 text-xs text-stone-500">{new Date(row.updatedAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
