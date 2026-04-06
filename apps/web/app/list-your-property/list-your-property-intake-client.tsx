"use client";

import { useState } from "react";

const PERMISSION_LABEL =
  "I confirm that I own this listing or have permission to publish it and its images.";

export function ListYourPropertyIntakeClient() {
  const [sourceType, setSourceType] = useState<"OWNER" | "BROKER" | "HOST">("OWNER");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [city, setCity] = useState("");
  const [propertyCategory, setPropertyCategory] = useState("");
  const [priceCad, setPriceCad] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [description, setDescription] = useState("");
  const [amenitiesText, setAmenitiesText] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [permission, setPermission] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setMessage("");
    const priceNum = parseFloat(priceCad.replace(/[^0-9.]/g, ""));
    const priceCents = Number.isFinite(priceNum) ? Math.round(priceNum * 100) : undefined;
    const urls = imageUrls
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http"));
    try {
      const res = await fetch("/api/listing-acquisition/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          contactName,
          contactEmail,
          contactPhone: contactPhone || undefined,
          city,
          propertyCategory,
          priceCents,
          bedrooms: bedrooms ? parseInt(bedrooms, 10) : undefined,
          bathrooms: bathrooms ? parseFloat(bathrooms) : undefined,
          description,
          amenitiesText: amenitiesText || undefined,
          sourcePlatformText: sourceNote || undefined,
          imageUrls: urls,
          permissionConfirm: permission,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("err");
        setMessage(typeof data.error === "string" ? data.error : "Could not submit");
        return;
      }
      setStatus("ok");
      setMessage("Thanks — our team will review your submission. We only publish permission-based content.");
    } catch {
      setStatus("err");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">
        Get direct exposure and direct inquiries. We help you publish faster — without copying listings from other sites.
        Use your own words and photos (or links you are allowed to share).
      </p>

      <div>
        <label className="block text-sm font-medium text-slate-800">I am a</label>
        <select
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as typeof sourceType)}
        >
          <option value="OWNER">Property owner (sale / long-term rent)</option>
          <option value="BROKER">Broker / agent</option>
          <option value="HOST">Short-term host (BNHub)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-800">Name</label>
        <input
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-800">Email</label>
        <input
          required
          type="email"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-800">Phone (optional)</label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-800">City / area</label>
        <input
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-800">Property type</label>
        <input
          required
          placeholder="e.g. Condo, single-family, cottage…"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={propertyCategory}
          onChange={(e) => setPropertyCategory(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-800">Price (CAD, optional)</label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={priceCad}
          onChange={(e) => setPriceCad(e.target.value)}
          placeholder="e.g. 549000"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-800">Bedrooms</label>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-800">Bathrooms</label>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-800">Description (your own summary)</label>
        <textarea
          required
          minLength={20}
          rows={5}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Factual details in your words — not pasted from another listing site."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-800">Amenities (optional)</label>
        <textarea
          rows={2}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={amenitiesText}
          onChange={(e) => setAmenitiesText(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-800">Image URLs (optional, one per line)</label>
        <textarea
          rows={3}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={imageUrls}
          onChange={(e) => setImageUrls(e.target.value)}
          placeholder="https://… (only images you own or may use)"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-800">How we reached you (internal note, optional)</label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={sourceNote}
          onChange={(e) => setSourceNote(e.target.value)}
          placeholder="e.g. Referral from Jane — not a URL to someone else’s listing"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-800">
        <input type="checkbox" className="mt-1" checked={permission} onChange={(e) => setPermission(e.target.checked)} />
        <span>{PERMISSION_LABEL}</span>
      </label>

      {status === "ok" ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {status === "err" ? <p className="text-sm text-red-600">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Submit for review"}
      </button>
    </form>
  );
}
