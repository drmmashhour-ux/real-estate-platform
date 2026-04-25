"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { BNHUB_LAUNCH_MIN_AMENITIES, BNHUB_LAUNCH_MIN_DESCRIPTION, BNHUB_LAUNCH_MIN_PHOTOS } from "@/lib/bnhub/bnhub-launch-quality";

const STEPS = ["Property", "Photos", "Price", "Publish"] as const;

export function BnhubHostOnboardingClient() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ listingCode: string } | null>(null);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [photos, setPhotos] = useState("");
  const [price, setPrice] = useState("119");
  const [amenities, setAmenities] = useState("Wi‑Fi, Kitchen, Workspace");
  const [description, setDescription] = useState("");

  function canAdvance(): boolean {
    if (step === 0) return title.trim().length > 2 && city.trim().length > 1;
    if (step === 1) {
      const lines = photos
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.startsWith("http"));
      return lines.length >= BNHUB_LAUNCH_MIN_PHOTOS;
    }
    if (step === 2) return Number(price) >= 1 && amenities.split(/[,;]+/).filter(Boolean).length >= BNHUB_LAUNCH_MIN_AMENITIES;
    if (step === 3) return description.trim().length >= BNHUB_LAUNCH_MIN_DESCRIPTION;
    return false;
  }

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/bnhub/host/quick-listing", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          city,
          address: address.trim() || undefined,
          description,
          price: Number(price),
          photos,
          amenities,
          publish: true,
          flagNewListing: true,
          flagSpecialOffer: false,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? "Could not publish");
        return;
      }
      setDone({ listingCode: j.listingCode });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 text-white sm:py-14">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]/85">BNHub host</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Quick onboarding</h1>
        <p className="text-sm text-white/55">
          Under three minutes: add your stay, meet the launch quality bar, and go live. You can refine everything later in
          the full editor.
        </p>
        <Link href="/en/ca/dashboard/bnhub/host" className="text-sm text-[#D4AF37] hover:underline">
          ← Host dashboard
        </Link>
      </header>

      {done ? (
        <div className="mt-10 rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 p-6 text-center">
          <Check className="mx-auto h-10 w-10 text-[#D4AF37]" aria-hidden />
          <p className="mt-4 text-lg font-semibold">You&apos;re live</p>
          <p className="mt-2 text-sm text-white/65">
            Listing code <span className="font-mono text-[#D4AF37]">{done.listingCode}</span>
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={`/bnhub/${encodeURIComponent(done.listingCode)}`}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#D4AF37]/50 px-4 text-sm font-semibold text-[#D4AF37]"
            >
              View listing
            </Link>
            <Link
              href="/en/ca/host/listings"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/15 px-4 text-sm text-white/80"
            >
              Manage listings
            </Link>
          </div>
        </div>
      ) : (
        <>
          <nav className="mt-8 flex items-center gap-1 text-xs text-white/45" aria-label="Steps">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <span className={i <= step ? "font-semibold text-[#D4AF37]" : ""}>
                  {i + 1}. {s}
                </span>
                {i < STEPS.length - 1 ? <ChevronRight className="mx-0.5 h-3.5 w-3.5 opacity-50" aria-hidden /> : null}
              </div>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#0A0A0A] p-5 sm:p-6">
            {step === 0 ? (
              <div className="space-y-4">
                <label className="block space-y-1 text-sm">
                  <span className="text-white/50">Property name</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/15 bg-black px-3"
                    placeholder="Sunny loft in Plateau"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-white/50">City</span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/15 bg-black px-3"
                    placeholder="Montreal"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-white/50">Street address (optional now)</span>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/15 bg-black px-3"
                    placeholder="123 Example St"
                  />
                </label>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-3">
                <p className="text-sm text-white/55">
                  Paste at least {BNHUB_LAUNCH_MIN_PHOTOS} HTTPS image URLs (one per line). Unsplash links work.
                </p>
                <textarea
                  value={photos}
                  onChange={(e) => setPhotos(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-white/15 bg-black px-3 py-2 font-mono text-xs"
                  placeholder={"https://images.unsplash.com/...\nhttps://images.unsplash.com/..."}
                />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <label className="block space-y-1 text-sm">
                  <span className="text-white/50">Nightly price (CAD)</span>
                  <input
                    type="number"
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/15 bg-black px-3"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-white/50">Amenities (comma-separated, min {BNHUB_LAUNCH_MIN_AMENITIES})</span>
                  <input
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/15 bg-black px-3"
                  />
                </label>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                <p className="text-sm text-white/55">
                  Clear description (min {BNHUB_LAUNCH_MIN_DESCRIPTION} characters): highlights, check-in vibe, and house
                  rules summary.
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={10}
                  minLength={BNHUB_LAUNCH_MIN_DESCRIPTION}
                  className="w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-sm"
                />
                <p className="text-xs text-white/35">{description.trim().length} / {BNHUB_LAUNCH_MIN_DESCRIPTION}+</p>
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="min-h-[48px] rounded-xl border border-white/15 px-4 text-sm"
                >
                  Back
                </button>
              ) : null}
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  disabled={!canAdvance()}
                  onClick={() => setStep((s) => s + 1)}
                  className="min-h-[48px] rounded-xl bg-[#D4AF37] px-6 text-sm font-semibold text-black disabled:opacity-40"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canAdvance() || busy}
                  onClick={publish}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#D4AF37] px-6 text-sm font-semibold text-black disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Publish listing
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
