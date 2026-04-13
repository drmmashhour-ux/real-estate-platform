"use client";

import { useEffect, useState } from "react";
import type { ListingContext } from "@/lib/ai/writer";

type FormSlice = {
  title: string;
  propertyType: string;
  address: string;
  city: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  surfaceSqft: string;
  yearBuilt: string;
  annualTaxes: string;
  condoFees: string;
};

/** Build context for `POST /api/ai/write` listing generation from wizard form state. */
export function buildFsboListingDescriptionContext(form: FormSlice): ListingContext {
  const pt = form.propertyType?.replace(/_/g, " ").trim();
  const loc = [form.address, form.city].map((s) => s?.trim()).filter(Boolean).join(", ");
  const n = Number.parseFloat(String(form.price).replace(/[^0-9.]/g, ""));
  const price =
    Number.isFinite(n) && n > 0 ? `$${n.toLocaleString("en-CA")} CAD` : undefined;
  const parts = [
    form.bedrooms?.trim() && `${form.bedrooms} bed`,
    form.bathrooms?.trim() && `${form.bathrooms} bath`,
    form.surfaceSqft?.trim() && `${form.surfaceSqft} sq ft living area`,
    form.yearBuilt?.trim() && `built ${form.yearBuilt}`,
    form.annualTaxes?.trim() && `taxes ~$${form.annualTaxes.replace(/[^0-9.]/g, "")}/yr`,
    form.condoFees?.trim() && `condo fees ~$${form.condoFees.replace(/[^0-9.]/g, "")}/mo`,
  ].filter(Boolean) as string[];
  const features = parts.length ? parts.join(" · ") : undefined;
  return {
    propertyType: pt || undefined,
    location: loc || form.city?.trim() || undefined,
    price,
    features,
  };
}

type WriteListingResponse = {
  text?: string;
  offline?: boolean;
  offlineHint?: string;
  error?: string;
};

/**
 * Drafts a professional listing description from structured fields + optional notes in the box.
 */
export function ListingDescriptionAiCopilot({
  form,
  currentDescription,
  onApply,
  disabled,
}: {
  form: FormSlice;
  currentDescription: string;
  onApply: (text: string) => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    setHint(null);
  }, [currentDescription, form.title, form.city, form.propertyType]);

  const listingContext = buildFsboListingDescriptionContext(form);
  const hasSeed =
    Boolean(form.title?.trim()) ||
    Boolean(form.city?.trim()) ||
    Boolean(form.propertyType) ||
    Boolean(listingContext.features) ||
    Boolean(listingContext.price) ||
    Boolean(listingContext.location) ||
    currentDescription.trim().length >= 8 ||
    Boolean(form.bedrooms?.trim()) ||
    Boolean(form.bathrooms?.trim()) ||
    Boolean(form.surfaceSqft?.trim());

  async function run() {
    setLoading(true);
    setHint(null);
    try {
      const titleLine = form.title?.trim() ? `Listing title: ${form.title.trim()}` : "";
      const extra =
        currentDescription.trim().length > 0
          ? `Seller notes / bullets to weave in (keep facts accurate):\n${currentDescription.trim()}`
          : "No extra notes — generate from the structured facts only.";
      const prompt = [titleLine, extra].filter(Boolean).join("\n\n");

      const res = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: "listing",
          action: "generate",
          prompt,
          listingContext,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as WriteListingResponse;
      if (!res.ok) {
        setHint(typeof data.error === "string" ? data.error : "Could not generate description");
        return;
      }
      if (typeof data.text === "string" && data.text.trim()) {
        onApply(data.text.trim());
        if (data.offline) {
          setHint(data.offlineHint ?? "Set OPENAI_API_KEY on the server for full AI descriptions.");
        }
      } else {
        setHint("No text returned — try again or add more property details.");
      }
    } catch {
      setHint("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        title="Generate a polished description from your property details (AI)"
        disabled={disabled || loading || !hasSeed}
        onClick={() => void run()}
        className="whitespace-nowrap rounded-lg border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 text-[11px] font-medium text-sky-100 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "…" : "Generate description"}
      </button>
      {hint ? <span className="max-w-[14rem] text-right text-[10px] text-amber-200/90">{hint}</span> : null}
    </span>
  );
}
