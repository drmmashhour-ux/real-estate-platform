"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoClient } from "@/lib/demo-track-client";
import { isPublicDemoMode } from "@/lib/demo-mode";
import { readDemoDealsFromStorage } from "@/lib/investment/demo-deals-storage";

type Props = {
  listingId: string;
  defaultOfferPriceUsd?: number | null;
};

const STORAGE_KEY = (id: string) => `lcipm_offer_prefill_${id}`;

export function OfferForm({ listingId, defaultOfferPriceUsd }: Props) {
  const router = useRouter();
  const [offeredPrice, setOfferedPrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [financing, setFinancing] = useState<"" | "yes" | "no">("");
  const [closingDate, setClosingDate] = useState("");
  const [conditions, setConditions] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const demo = isPublicDemoMode();
  const staging = process.env.NEXT_PUBLIC_ENV === "staging";

  useEffect(() => {
    trackDemoClient(DemoEvents.OFFER_STARTED, { listingId });
  }, [listingId]);

  useEffect(() => {
    const base =
      defaultOfferPriceUsd != null && Number.isFinite(defaultOfferPriceUsd) && defaultOfferPriceUsd > 0
        ? String(Math.round(defaultOfferPriceUsd))
        : "";
    let price = "";
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY(listingId));
      if (raw) {
        const j = JSON.parse(raw) as { offeredPrice?: number; scenario?: unknown };
        if (typeof j.offeredPrice === "number" && j.offeredPrice > 0) {
          price = String(Math.round(j.offeredPrice));
        }
      }
    } catch {
      /* ignore */
    }
    if (!price && base) price = base;
    if (!price) {
      try {
        const deals = readDemoDealsFromStorage();
        const top = deals?.[0];
        if (top && typeof top.propertyPrice === "number" && top.propertyPrice > 0) {
          price = String(Math.round(top.propertyPrice));
          setMessage((m) => (m ? m : `From saved deal (${top.city}) — adjust as needed.`));
        }
      } catch {
        /* ignore */
      }
    }
    if (price) setOfferedPrice(price);
  }, [listingId, defaultOfferPriceUsd]);

  const scenarioPayload = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY(listingId));
      if (!raw) return undefined;
      const j = JSON.parse(raw) as { scenario?: unknown };
      return j.scenario;
    } catch {
      return undefined;
    }
  }, [listingId]);

  const inputCls =
    "mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600";

  async function saveDraft() {
    setErr(null);
    setLoading(true);
    try {
      const body = buildBody(true);
      const res = await fetch("/api/offers/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { error?: string; offer?: { id: string } };
      if (!res.ok) {
        setErr(j.error ?? "Could not save draft");
        return;
      }
      router.push(`/dashboard/offers/${j.offer?.id}`);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  function buildBody(includeScenario: boolean) {
    const op = parseFloat(offeredPrice);
    return {
      listingId,
      offeredPrice: op,
      downPaymentAmount: downPayment === "" ? undefined : parseFloat(downPayment),
      financingNeeded: financing === "" ? undefined : financing === "yes",
      closingDate: closingDate || undefined,
      conditions: conditions || undefined,
      message: message || undefined,
      ...(includeScenario && scenarioPayload !== undefined ? { scenario: scenarioPayload } : {}),
    };
  }

  async function submitOffer() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(buildBody(true)),
      });
      const j = (await res.json()) as { error?: string; offer?: { id: string } };
      if (!res.ok) {
        setErr(j.error ?? "Submit failed");
        return;
      }
      if (j.offer?.id) router.push(`/dashboard/offers/${j.offer.id}`);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[#C9A96E]/25 bg-gradient-to-br from-[#C9A96E]/10 to-black/90 p-6 text-white shadow-xl">
      <h1 className="text-xl font-bold text-[#C9A96E]">Make an offer</h1>
      <p className="mt-2 text-sm text-slate-400">Listing · {listingId.slice(0, 14)}…</p>

      {staging || demo ? (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-100/95">
          This is a demo workflow. No real legal transaction is created.
        </p>
      ) : null}

      <p className="mt-4 text-sm leading-relaxed text-slate-300">
        Submitting an offer through the platform records your intent and workflow details. Final legal documentation and broker
        validation may still be required.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block text-xs text-slate-400">
          Offered price (USD) <span className="text-red-400">*</span>
          <input
            type="number"
            min={1}
            step={1000}
            required
            className={inputCls}
            value={offeredPrice}
            onChange={(e) => setOfferedPrice(e.target.value)}
          />
        </label>
        <label className="block text-xs text-slate-400">
          Down payment (optional)
          <input
            type="number"
            min={0}
            step={1000}
            className={inputCls}
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
          />
        </label>
        <label className="block text-xs text-slate-400">
          Financing needed
          <select
            className={inputCls}
            value={financing}
            onChange={(e) => setFinancing(e.target.value as "" | "yes" | "no")}
          >
            <option value="">—</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="block text-xs text-slate-400">
          Desired closing date
          <input type="date" className={inputCls} value={closingDate} onChange={(e) => setClosingDate(e.target.value)} />
        </label>
        <label className="block text-xs text-slate-400">
          Conditions (optional)
          <textarea
            className={`${inputCls} min-h-[80px]`}
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            maxLength={8000}
          />
        </label>
        <label className="block text-xs text-slate-400">
          Message to broker (optional)
          <textarea
            className={`${inputCls} min-h-[80px]`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={4000}
          />
        </label>
      </div>

      {err ? (
        <p className="mt-4 text-sm text-red-300" role="alert">
          {err}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={loading}
          onClick={() => void submitOffer()}
          className="rounded-lg bg-[#C9A96E] px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Working…" : "Submit offer"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void saveDraft()}
          className="rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save draft
        </button>
        <Link
          href={`/listings/${listingId}`}
          className="rounded-lg px-4 py-3 text-center text-sm text-slate-400 hover:text-white"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
