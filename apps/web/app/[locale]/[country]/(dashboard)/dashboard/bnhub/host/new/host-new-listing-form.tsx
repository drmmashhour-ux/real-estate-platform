"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function HostNewListingForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerNight, setPricePerNight] = useState<string>("");
  const [imageUrls, setImageUrls] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageHint = useMemo(() => {
    if (!imageUrls.trim()) return "Comma-separated (e.g. url1, url2)";
    return "Looks good";
  }, [imageUrls]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const price = Number(pricePerNight);
      const res = await fetch("/api/bnhub/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          location,
          pricePerNight: Number.isFinite(price) ? price : pricePerNight,
          imageUrls,
        }),
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(out?.error ?? "Failed to create listing");
      }

      router.push("/dashboard/bnhub/host");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Listing details</h2>
          <p className="text-sm opacity-80">
            Fields here map to the BNHUB short-term listing model.
          </p>
        </div>
        <Link
          href="/dashboard/bnhub/host"
          className="text-sm font-medium opacity-80 hover:opacity-100"
        >
          Cancel
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium opacity-80">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
            placeholder="Luxury Apartment Montreal"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium opacity-80">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[96px] w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
            placeholder="Short summary of the stay..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium opacity-80">
            Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
            placeholder="Montreal"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium opacity-80">
            Price per night
          </label>
          <input
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            type="number"
            min={1}
            step={1}
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
            placeholder="120"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium opacity-80">
            Image URLs
          </label>
          <input
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
            placeholder="https://.../photo1.jpg, https://.../photo2.jpg"
          />
          <p className="mt-1 text-xs opacity-60">{imageHint}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--hub-accent)" }}
        >
          {loading ? "Creating..." : "Create listing"}
        </button>
      </div>
    </form>
  );
}

