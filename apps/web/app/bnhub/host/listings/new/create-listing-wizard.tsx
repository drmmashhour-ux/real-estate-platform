"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AiWriterToolbar } from "@/components/ai/AiWriterToolbar";
import { SpellCheckField } from "@/components/spell/SpellCheckField";
import { LegalReadinessPanel } from "@/components/legal/LegalReadinessPanel";

const STEPS = [
  "Basics",
  "Location",
  "Details",
  "Photos",
  "Pricing",
  "Booking",
  "Review",
] as const;

export function CreateListingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    title: "",
    subtitle: "",
    description: "",
    propertyType: "House",
    roomType: "Entire place",
    address: "",
    city: "",
    region: "",
    country: "US",
    beds: "1",
    baths: "1",
    maxGuests: "2",
    amenities: "" as string,
    houseRules: "",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    cancellationPolicy: "moderate",
    photos: "" as string,
    nightPriceCents: "",
    cleaningFeeCents: "0",
    securityDepositCents: "0",
    instantBookEnabled: false,
    minStayNights: "",
    maxStayNights: "",
    listingStatus: "DRAFT" as "DRAFT" | "PUBLISHED",
    conditionOfProperty: "",
    knownIssues: "",
  });

  const update = (k: keyof typeof data, v: string | number | boolean) => {
    setData((d) => ({ ...d, [k]: v }));
    setError("");
  };

  async function handleSubmit() {
    setError("");
    const photoUrls = data.photos.split(",").map((u) => u.trim()).filter(Boolean);
    const desc = data.description.trim();
    if (desc.length < 20) {
      setError("Description must be at least 20 characters.");
      return;
    }
    if (photoUrls.length < 1) {
      setError("Add at least one photo URL in the Photos step (comma-separated).");
      return;
    }
    if (!data.title.trim() || !data.address.trim() || !data.city.trim()) {
      setError("Title, address, and city are required.");
      return;
    }
    const price = Number(data.nightPriceCents);
    if (!Number.isFinite(price) || price < 100) {
      setError("Nightly price must be at least $1.00 (100 cents).");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: data.title.trim(),
        subtitle: data.subtitle.trim() || undefined,
        description: desc,
        propertyType: data.propertyType,
        roomType: data.roomType,
        address: data.address.trim(),
        city: data.city.trim(),
        region: data.region.trim() || undefined,
        country: data.country,
        nightPriceCents: price,
        beds: parseInt(data.beds, 10) || 1,
        baths: parseFloat(data.baths) || 1,
        maxGuests: parseInt(data.maxGuests, 10) || 2,
        photos: photoUrls,
        amenities: data.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        houseRules: data.houseRules.trim() || undefined,
        checkInTime: data.checkInTime || undefined,
        checkOutTime: data.checkOutTime || undefined,
        cancellationPolicy: data.cancellationPolicy,
        cleaningFeeCents: Number(data.cleaningFeeCents) || 0,
        securityDepositCents: Number(data.securityDepositCents) || 0,
        instantBookEnabled: data.instantBookEnabled,
        minStayNights: data.minStayNights ? parseInt(data.minStayNights, 10) : undefined,
        maxStayNights: data.maxStayNights ? parseInt(data.maxStayNights, 10) : undefined,
        listingStatus: data.listingStatus,
      };
      const res = await fetch("/api/bnhub/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error ?? "Failed to create listing");
      router.push("/bnhub/host/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
              i === step
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Property basics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Property type</label>
                <select
                  value={data.propertyType}
                  onChange={(e) => update("propertyType", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                >
                  <option>House</option>
                  <option>Apartment</option>
                  <option>Villa</option>
                  <option>Cabin</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Room type</label>
                <select
                  value={data.roomType}
                  onChange={(e) => update("roomType", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                >
                  <option>Entire place</option>
                  <option>Private room</option>
                  <option>Shared room</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Beds</label>
                <input
                  type="number"
                  min={1}
                  value={data.beds}
                  onChange={(e) => update("beds", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Bathrooms</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={data.baths}
                  onChange={(e) => update("baths", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-400">Max guests</label>
                <input
                  type="number"
                  min={1}
                  value={data.maxGuests}
                  onChange={(e) => update("maxGuests", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Location</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Address</label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Street address"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">City</label>
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Region / State</label>
                  <input
                    type="text"
                    value={data.region}
                    onChange={(e) => update("region", e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Country</label>
                <input
                  type="text"
                  value={data.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Title</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Cozy downtown apartment"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Subtitle (optional)</label>
                <SpellCheckField
                  value={data.subtitle}
                  onChange={(v) => update("subtitle", v)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  variant="slate"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Description</label>
                <AiWriterToolbar
                  className="mb-2"
                  type="listing"
                  value={data.description}
                  onChange={(v) => update("description", v)}
                  listingContext={{
                    propertyType: `${data.propertyType} · ${data.roomType}`,
                    location: [data.address, data.city, data.region, data.country].filter(Boolean).join(", "),
                    price: data.nightPriceCents
                      ? `$${(Number(data.nightPriceCents) / 100).toFixed(0)} / night (preview)`
                      : undefined,
                    features: [
                      `${data.beds} beds`,
                      `${data.baths} baths`,
                      `up to ${data.maxGuests} guests`,
                      data.amenities ? `Amenities: ${data.amenities}` : null,
                      data.title ? `Working title: ${data.title}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  }}
                />
                <SpellCheckField
                  multiline
                  value={data.description}
                  onChange={(v) => update("description", v)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  variant="slate"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={data.amenities}
                  onChange={(e) => update("amenities", e.target.value)}
                  placeholder="WiFi, Kitchen, Parking, TV"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">House rules</label>
                <textarea
                  value={data.houseRules}
                  onChange={(e) => update("houseRules", e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Condition of property (required to publish)</label>
                <SpellCheckField
                  value={data.conditionOfProperty}
                  onChange={(v) => update("conditionOfProperty", v)}
                  placeholder="e.g. Good, Excellent, Recently renovated"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  variant="slate"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Known issues (required to publish; use &quot;None&quot; if none)</label>
                <SpellCheckField
                  multiline
                  value={data.knownIssues}
                  onChange={(v) => update("knownIssues", v)}
                  rows={2}
                  placeholder="e.g. None, or describe any known issues"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  variant="slate"
                />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Photos</h2>
            <p className="mt-1 text-xs text-slate-500">Enter image URLs, one per line or comma-separated.</p>
            <div className="mt-4">
              <textarea
                value={data.photos}
                onChange={(e) => update("photos", e.target.value)}
                rows={4}
                placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Pricing</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Nightly price (USD)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={data.nightPriceCents ? Number(data.nightPriceCents) / 100 : ""}
                  onChange={(e) => update("nightPriceCents", e.target.value ? String(Math.round(parseFloat(e.target.value) * 100)) : "")}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Cleaning fee (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                  value={data.cleaningFeeCents ? Number(data.cleaningFeeCents) / 100 : "0"}
                  onChange={(e) => update("cleaningFeeCents", e.target.value ? String(Math.round(parseFloat(e.target.value) * 100)) : "0")}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Security deposit (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                  value={data.securityDepositCents ? Number(data.securityDepositCents) / 100 : "0"}
                  onChange={(e) => update("securityDepositCents", e.target.value ? String(Math.round(parseFloat(e.target.value) * 100)) : "0")}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Guest pricing includes Québec GST (5%) and QST (9.975% on amount including GST) on rent + cleaning, calculated automatically at checkout.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Min stay (nights)</label>
                  <input
                    type="number"
                    min={0}
                    value={data.minStayNights}
                    onChange={(e) => update("minStayNights", e.target.value)}
                    placeholder="None"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Max stay (nights)</label>
                  <input
                    type="number"
                    min={0}
                    value={data.maxStayNights}
                    onChange={(e) => update("maxStayNights", e.target.value)}
                    placeholder="None"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Booking settings</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Check-in time</label>
                <input
                  type="text"
                  value={data.checkInTime}
                  onChange={(e) => update("checkInTime", e.target.value)}
                  placeholder="15:00"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Check-out time</label>
                <input
                  type="text"
                  value={data.checkOutTime}
                  onChange={(e) => update("checkOutTime", e.target.value)}
                  placeholder="11:00"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Cancellation policy</label>
                <select
                  value={data.cancellationPolicy}
                  onChange={(e) => update("cancellationPolicy", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                >
                  <option value="flexible">Flexible</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.instantBookEnabled}
                  onChange={(e) => update("instantBookEnabled", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
                />
                <span className="text-sm text-slate-300">Instant book enabled</span>
              </label>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Review & submit</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <p><span className="text-slate-500">Title:</span> {data.title || "—"}</p>
              <p><span className="text-slate-500">Location:</span> {data.address}, {data.city}, {data.country}</p>
              <p><span className="text-slate-500">Nightly:</span> ${data.nightPriceCents ? (Number(data.nightPriceCents) / 100).toFixed(0) : "—"}</p>
              <p><span className="text-slate-500">Instant book:</span> {data.instantBookEnabled ? "Yes" : "No"}</p>
            </div>
            <div className="mt-6">
              <label className="mb-2 block text-xs text-slate-400">Publish now or save as draft?</label>
              <select
                value={data.listingStatus}
                onChange={(e) => update("listingStatus", e.target.value as "DRAFT" | "PUBLISHED")}
                className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
              >
                <option value="DRAFT">Save as draft</option>
                <option value="PUBLISHED">Publish (will appear in search after verification if required)</option>
              </select>
            </div>
            <div className="mt-6">
              <LegalReadinessPanel
                listing={{
                  title: data.title,
                  description: data.description,
                  city: data.city,
                  imageCount: data.photos.split(",").map((u) => u.trim()).filter(Boolean).length,
                  contactEmail: "",
                }}
              />
            </div>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !data.title.trim() || !data.address.trim() || !data.city.trim() || !data.nightPriceCents}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create listing"}
          </button>
        )}
      </div>
    </div>
  );
}
