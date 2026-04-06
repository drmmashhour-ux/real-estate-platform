"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useListingWizard } from "@/stores/useListingWizard";

export function StepReview() {
  const router = useRouter();
  const title = useListingWizard((s) => s.title);
  const city = useListingWizard((s) => s.city);
  const price = useListingWizard((s) => s.price);
  const description = useListingWizard((s) => s.description);
  const amenities = useListingWizard((s) => s.amenities);
  const photos = useListingWizard((s) => s.photos);
  const previewUrls = useListingWizard((s) => s.previewUrls);
  const prevStep = useListingWizard((s) => s.prevStep);
  const reset = useListingWizard((s) => s.reset);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(listingStatus: "DRAFT" | "PUBLISHED") {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          city: city.trim(),
          price,
          description,
          amenities,
          listingStatus,
        }),
      });
      const j = (await r.json()) as {
        error?: string;
        listing?: { id: string };
        reasons?: string[];
      };

      const listingId = j.listing?.id;
      if (!listingId) {
        setErr(j.error ?? "Could not create listing");
        setBusy(false);
        return;
      }

      for (const file of photos) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(`/api/host/listings/${listingId}/photos`, {
          method: "POST",
          body: fd,
        });
        if (!up.ok) {
          const uj = (await up.json().catch(() => ({}))) as { error?: string };
          console.warn("Photo upload failed:", uj.error ?? up.status);
        }
      }

      if (!r.ok && j.error) {
        setErr(
          `${j.error} Your listing is saved; finish verification in the editor to go live.`
        );
      }
      reset();
      router.push(`/bnhub/host/listings/${listingId}/edit`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const cover = previewUrls[0];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="aspect-[16/9] w-full object-cover" />
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center text-slate-500">No photo yet</div>
        )}
        <div className="space-y-1 p-4">
          <p className="text-xl font-semibold text-white">{title.trim() || `Stay in ${city}`}</p>
          <p className="text-slate-400">{city}</p>
          <p className="text-lg font-bold text-emerald-400">
            ${Number.isFinite(price) ? price : 0}{" "}
            <span className="text-sm font-normal text-slate-500">/ night</span>
          </p>
        </div>
      </div>

      {err ? <p className="rounded-xl bg-rose-500/15 p-3 text-sm text-rose-100">{err}</p> : null}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={busy || !city.trim()}
          onClick={() => void submit("PUBLISHED")}
          className="w-full rounded-2xl bg-emerald-500 py-4 text-lg font-semibold text-slate-950 disabled:opacity-40"
        >
          {busy ? "Working…" : "Publish"}
        </button>
        <button
          type="button"
          disabled={busy || !city.trim()}
          onClick={() => void submit("DRAFT")}
          className="w-full rounded-2xl border border-white/25 py-4 text-lg font-semibold text-white disabled:opacity-40"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => prevStep()}
          disabled={busy}
          className="w-full py-2 text-sm text-slate-500 underline"
        >
          Back
        </button>
      </div>

      {photos.length > 0 ? (
        <p className="text-center text-xs text-slate-500">
          {photos.length} photo{photos.length !== 1 ? "s" : ""} will upload after the listing is created.
        </p>
      ) : null}
    </div>
  );
}
