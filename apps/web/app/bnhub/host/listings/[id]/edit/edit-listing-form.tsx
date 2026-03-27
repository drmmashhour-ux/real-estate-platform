"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AiWriterToolbar } from "@/components/ai/AiWriterToolbar";
import { SpellCheckField } from "@/components/spell/SpellCheckField";

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
  conditionOfProperty?: string | null;
  knownIssues?: string | null;
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
  const [conditionOfProperty, setConditionOfProperty] = useState(listing.conditionOfProperty ?? "");
  const [knownIssues, setKnownIssues] = useState(listing.knownIssues ?? "");
  const [loading, setLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [error, setError] = useState("");
  const [publishReasons, setPublishReasons] = useState<string[]>([]);

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
    setConditionOfProperty(listing.conditionOfProperty ?? "");
    setKnownIssues(listing.knownIssues ?? "");
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
          conditionOfProperty: conditionOfProperty.trim() || undefined,
          knownIssues: knownIssues.trim() || undefined,
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

  async function handlePublish() {
    setError("");
    setPublishReasons([]);
    setPublishLoading(true);
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
          conditionOfProperty: conditionOfProperty.trim() || undefined,
          knownIssues: knownIssues.trim() || undefined,
          listingStatus: "PUBLISHED",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Cannot publish");
        if (Array.isArray(data.reasons)) setPublishReasons(data.reasons);
        return;
      }
      router.push("/bnhub/host/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-4 py-3">
        <Link
          href={`/bnhub/host/listings/${listing.id}/setup`}
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          Setup checklist &amp; progress →
        </Link>
        <p className="mt-1 text-xs text-slate-500">
          Property, photos, disclosure, seller agreement fields, contracts, then publish.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">Title</label>
        <SpellCheckField
          value={title}
          onChange={setTitle}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          variant="slate"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">Description</label>
        <AiWriterToolbar
          className="mb-2"
          type="listing"
          value={description}
          onChange={setDescription}
          listingContext={{
            propertyType: "Short-term rental (BNHub)",
            location: [address, city, country].filter(Boolean).join(", "),
            price: nightPrice ? `$${nightPrice}/night` : undefined,
            features: [beds + " beds", baths + " baths", maxGuests + " max guests", title].join(" · "),
          }}
        />
        <SpellCheckField
          multiline
          value={description}
          onChange={setDescription}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          variant="slate"
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
        <label className="mb-1 block text-xs font-medium text-slate-400">Condition of property (required to publish)</label>
        <SpellCheckField
          value={conditionOfProperty}
          onChange={setConditionOfProperty}
          placeholder="e.g. Good, Excellent, Recently renovated"
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          variant="slate"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">Known issues (required to publish; use &quot;None&quot; if none)</label>
        <SpellCheckField
          multiline
          value={knownIssues}
          onChange={setKnownIssues}
          rows={2}
          placeholder="e.g. None, or describe any known issues"
          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          variant="slate"
        />
      </div>
      <div>
        <Link
          href={`/bnhub/host/listings/${listing.id}/disclosure`}
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          Complete Seller Declaration (required to publish) →
        </Link>
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
      {publishReasons.length > 0 && (
        <ul className="list-inside list-disc text-sm text-amber-400">
          {publishReasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={loading || publishLoading}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 disabled:opacity-50"
        >
          {publishLoading ? "Publishing…" : "Publish listing"}
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
