"use client";

import * as React from "react";

import { buildBuyerLandingPage } from "@/modules/growth/landing-page.service";
import { postFastDealSourceEventLog } from "@/lib/growth/fast-deal-client-log";

type Status = "idle" | "submitting" | "success" | "error";

export function LeadCaptureLandingPage({
  locale,
  country,
  defaultCity = "Montréal",
  enableFastDealLogging = false,
}: {
  locale: string;
  country: string;
  defaultCity?: string;
  enableFastDealLogging?: boolean;
}) {
  void locale;
  void country;
  const [city, setCity] = React.useState(defaultCity);
  const template = React.useMemo(() => buildBuyerLandingPage(city), [city]);
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMsg, setErrorMsg] = React.useState("");
  const formStartedRef = React.useRef(false);

  React.useEffect(() => {
    if (!enableFastDealLogging || typeof window === "undefined") return;
    const key = `fd_lp_pv_${city}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void postFastDealSourceEventLog({
      sourceType: "landing_capture",
      sourceSubType: "landing_preview_shown",
      metadata: { marketVariant: city },
    });
  }, [city, enableFastDealLogging]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const propertyLinkOrAddress = String(fd.get("propertyLinkOrAddress") ?? "").trim();
    const notesRaw = String(fd.get("notes") ?? "").trim();
    const notes = [
      notesRaw,
      `[fast-deal-v2] Growth dashboard preview · market: ${city.trim() || "—"}`,
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!name || !propertyLinkOrAddress) {
      setStatus("error");
      setErrorMsg("Add your name and where you are looking (address, area, or link).");
      return;
    }
    if (!email && !phone) {
      setStatus("error");
      setErrorMsg("Provide an email or phone number.");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/growth/early-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          propertyLinkOrAddress,
          notes,
          ...(enableFastDealLogging
            ? {
                growthDashMarket: city.trim() || "—",
                growthDashChannel: "growth_dashboard_preview",
              }
            : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  return (
    <section
      className="rounded-xl border border-indigo-900/40 bg-indigo-950/15 p-4"
      data-growth-lead-capture-landing-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-300/90">
            High-converting landing (V2 preview)
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Buyer capture block</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Same payload as public early leads — <code className="text-zinc-400">POST /api/growth/early-leads</code>. For
            testing only; production traffic should use your public /get-leads or ads URLs.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Market label
          <input
            className="w-44 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-black/40 p-6">
        <h4 className="text-center text-2xl font-bold tracking-tight text-white">{template.headline}</h4>
        <p className="mt-2 text-center text-sm text-zinc-400">{template.subheadline}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {template.sections.map((s) => (
            <div key={s.title} className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-4">
              <p className="font-semibold text-indigo-200">{s.title}</p>
              <p className="mt-2 text-sm text-zinc-400">{s.content}</p>
            </div>
          ))}
        </div>

        <form
          className="mx-auto mt-8 max-w-md space-y-3"
          onFocusCapture={() => {
            if (!enableFastDealLogging || formStartedRef.current) return;
            formStartedRef.current = true;
            void postFastDealSourceEventLog({
              sourceType: "landing_capture",
              sourceSubType: "lead_form_started",
              metadata: { marketVariant: city },
            });
          }}
          onSubmit={onSubmit}
        >
          <div>
            <label className="text-xs text-zinc-500" htmlFor="fast-deal-name">
              Name
            </label>
            <input
              id="fast-deal-name"
              name="name"
              required
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              autoComplete="name"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-500" htmlFor="fast-deal-email">
                Email
              </label>
              <input
                id="fast-deal-email"
                name="email"
                type="email"
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500" htmlFor="fast-deal-phone">
                Phone
              </label>
              <input
                id="fast-deal-phone"
                name="phone"
                type="tel"
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                autoComplete="tel"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500" htmlFor="fast-deal-area">
              Where are you looking? (address, neighborhood, or link)
            </label>
            <input
              id="fast-deal-area"
              name="propertyLinkOrAddress"
              required
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500" htmlFor="fast-deal-notes">
              Notes (optional)
            </label>
            <textarea
              id="fast-deal-notes"
              name="notes"
              rows={2}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            />
          </div>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {template.cta}
          </button>
          {status === "success" ? (
            <p className="text-center text-sm text-emerald-400">Received — we will follow up.</p>
          ) : null}
          {status === "error" && errorMsg ? (
            <p className="text-center text-sm text-red-400">{errorMsg}</p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
