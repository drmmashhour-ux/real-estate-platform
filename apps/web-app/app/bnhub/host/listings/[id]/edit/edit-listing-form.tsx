"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  address: string;
  city: string;
  country: string;
  nightPriceCents: number;
  beds: number;
  baths: number;
  maxGuests: number;
  photos: string[];
};

export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description ?? "");
  const [address, setAddress] = useState(listing.address);
  const [city, setCity] = useState(listing.city);
  const [country, setCountry] = useState(listing.country);
  const [nightPrice, setNightPrice] = useState((listing.nightPriceCents / 100).toString());
  const [beds, setBeds] = useState(listing.beds.toString());
  const [baths, setBaths] = useState(listing.baths.toString());
  const [maxGuests, setMaxGuests] = useState(listing.maxGuests.toString());
  const [photos, setPhotos] = useState(listing.photos.join(", "));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(listing.title);
    setDescription(listing.description ?? "");
    setAddress(listing.address);
    setCity(listing.city);
    setCountry(listing.country);
    setNightPrice((listing.nightPriceCents / 100).toString());
    setBeds(listing.beds.toString());
    setBaths(listing.baths.toString());
    setMaxGuests(listing.maxGuests.toString());
    setPhotos(listing.photos.join(", "));
  }, [listing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/bnhub/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          address,
          city,
          country,
          nightPriceCents: Math.round(parseFloat(nightPrice) * 100),
          beds: parseInt(beds, 10),
          baths: parseFloat(baths),
          maxGuests: parseInt(maxGuests, 10) || 4,
          photos: photos.split(",").map((u) => u.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      router.push("/bnhub/host/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">City</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Country</label>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Night price ($)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={nightPrice}
            onChange={(e) => setNightPrice(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Max guests</label>
          <input
            type="number"
            min="1"
            value={maxGuests}
            onChange={(e) => setMaxGuests(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Beds</label>
          <input
            type="number"
            min="0"
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Baths</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={baths}
            onChange={(e) => setBaths(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">Photo URLs (comma-separated)</label>
        <input
          value={photos}
          onChange={(e) => setPhotos(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
        <Link
          href="/bnhub/host/dashboard"
          className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
